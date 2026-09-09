import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Purge the entire Next.js Server Component cache so layouts re-run protectPage
  revalidatePath('/', 'layout');

  return NextResponse.json(
    { message: "Logged out successfully" },
    { status: 200 }
  );
}