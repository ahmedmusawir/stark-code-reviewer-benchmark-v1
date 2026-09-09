import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name || null,
      },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Purge the entire Next.js Server Component cache so layouts re-run protectPage
  revalidatePath('/', 'layout');

  return NextResponse.json({ data }, { status: 200 });
}
