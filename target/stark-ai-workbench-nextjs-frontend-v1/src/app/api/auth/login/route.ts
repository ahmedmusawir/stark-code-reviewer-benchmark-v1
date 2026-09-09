import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Ensure this route is always dynamic and not cached
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// Testing the route
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const res = NextResponse.json(
    { message: "Auth login Route Accessed Successfully!" },
    { status: 200 }
  );
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  return res;
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const err = NextResponse.json({ error: error.message }, { status: 400 });
    err.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    err.headers.set("Pragma", "no-cache");
    err.headers.set("Expires", "0");
    return err;
  }

  // Purge the entire Next.js Server Component cache so layouts re-run protectPage
  revalidatePath('/', 'layout');

  // Fetch the user's role from user_roles table
  let role = null;
  if (data.user) {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id)
      .single();
    
    role = roleData?.role || null;
  }

  const res = NextResponse.json({ 
    data: {
      ...data,
      role
    }
  }, { status: 200 });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  return res;
}
