import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getUserRole } from "@/utils/get-user-role";

export async function POST(req: NextRequest) {
  // Step 1: Verify the caller is a superadmin
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const callerRole = await getUserRole(user.id);
  if (callerRole !== "superadmin") {
    return NextResponse.json({ error: "Forbidden: Only superadmins can create admin users" }, { status: 403 });
  }

  // Step 2: Create the new user using admin client
  const { email, password, role } = await req.json();

  if (!email || !password || !role) {
    return NextResponse.json({ error: "Missing required fields: email, password, role" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Step 3: Update the user_roles table to set the requested role
  const newUserId = data.user?.id;
  if (!newUserId) {
    return NextResponse.json({ error: "User created but ID not found" }, { status: 500 });
  }

  const { error: roleUpdateError } = await adminClient
    .from("user_roles")
    .update({ role })
    .eq("user_id", newUserId);

  if (roleUpdateError) {
    return NextResponse.json({ error: `User created but role update failed: ${roleUpdateError.message}` }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 200 });
}
