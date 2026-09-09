"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const PAGE_SIZE = 6;

export type UserWithRole = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  created_at: string | null;
};

// ---------------------------------------------------------------------------
// getUsers — paginated list of all users (profiles + user_roles merged in JS)
// ---------------------------------------------------------------------------
// profiles and user_roles both FK to auth.users but have no direct FK to each
// other, so PostgREST nested select fails. We fetch both tables separately and
// merge on id / user_id.
export async function getUsers(page: number = 1): Promise<{
  users: UserWithRole[];
  total: number;
}> {
  const adminClient = createAdminClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Query 1: get all non-superadmin user IDs so pagination math is correct
  const { data: nonSuperadminRoles, error: rolesFilterError } = await adminClient
    .from("user_roles")
    .select("user_id")
    .neq("role", "superadmin");

  if (rolesFilterError) {
    throw new Error(`Failed to fetch role filter: ${rolesFilterError.message}`);
  }

  const allowedIds = (nonSuperadminRoles ?? []).map((r) => r.user_id);

  if (allowedIds.length === 0) {
    return { users: [], total: 0 };
  }

  // Query 2: paginated profiles restricted to non-superadmin IDs — count is now accurate
  const { data: profiles, error: profilesError, count } = await adminClient
    .from("profiles")
    .select("id, full_name, email, created_at", { count: "exact" })
    .in("id", allowedIds)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (profilesError) {
    throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
  }

  if (!profiles || profiles.length === 0) {
    return { users: [], total: count ?? 0 };
  }

  // Query 3: roles for only the users on this page
  const ids = profiles.map((p) => p.id);
  const { data: roles, error: rolesError } = await adminClient
    .from("user_roles")
    .select("user_id, role")
    .in("user_id", ids);

  if (rolesError) {
    throw new Error(`Failed to fetch roles: ${rolesError.message}`);
  }

  // Build a role lookup map
  const roleMap = new Map((roles ?? []).map((r) => [r.user_id, r.role]));

  const users: UserWithRole[] = profiles.map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: p.email,
    created_at: p.created_at,
    role: roleMap.get(p.id) ?? "member",
  }));

  return { users, total: count ?? 0 };
}

// ---------------------------------------------------------------------------
// getUserById — fetch a single user's profile + role for the edit form
// ---------------------------------------------------------------------------
export async function getUserById(userId: string): Promise<UserWithRole | null> {
  const adminClient = createAdminClient();

  const [{ data: profile, error: profileError }, { data: roleRow, error: roleError }] =
    await Promise.all([
      adminClient
        .from("profiles")
        .select("id, full_name, email, created_at")
        .eq("id", userId)
        .single(),
      adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single(),
    ]);

  if (profileError || !profile) return null;

  return {
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    created_at: profile.created_at,
    role: roleError || !roleRow ? "member" : roleRow.role,
  };
}

// ---------------------------------------------------------------------------
// addUser — create auth user via admin API; trigger handles profiles + user_roles
// ---------------------------------------------------------------------------
function toTitleCase(name: string): string {
  return name.trim().replace(/\b\w+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

export async function addUser(formData: {
  name: string;
  email: string;
  password: string;
  role: string;
}): Promise<{ error?: string }> {
  const adminClient = createAdminClient();
  const fullName = toTitleCase(formData.name);

  const { error } = await adminClient.auth.admin.createUser({
    email: formData.email,
    password: formData.password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: formData.role,
    },
  });

  if (error) {
    if (
      error.message.toLowerCase().includes("already been registered") ||
      error.message.toLowerCase().includes("already exists") ||
      error.message.toLowerCase().includes("duplicate") ||
      error.message.toLowerCase().includes("user already")
    ) {
      return { error: `A user with the email "${formData.email}" already exists.` };
    }
    return { error: error.message };
  }

  // The smart trigger reads 'role' and 'full_name' from metadata and inserts
  // into both user_roles and profiles automatically — no manual inserts needed.

  revalidatePath("/superadmin-portal");
  return {};
}

// ---------------------------------------------------------------------------
// editUser — update a user's full_name and/or role
// ---------------------------------------------------------------------------
export async function editUser(
  userId: string,
  formData: { name: string; role: string }
): Promise<{ error?: string }> {
  const adminClient = createAdminClient();
  const fullName = toTitleCase(formData.name);

  // Update display name in auth user_metadata (keep in sync with profiles)
  const { error: authError } = await adminClient.auth.admin.updateUserById(
    userId,
    { user_metadata: { full_name: fullName } }
  );

  if (authError) {
    return { error: authError.message };
  }

  // Update full_name in profiles table
  const { error: profileError } = await adminClient
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", userId);

  if (profileError) {
    return { error: profileError.message };
  }

  // Update role in user_roles table
  const { error: roleError } = await adminClient
    .from("user_roles")
    .update({ role: formData.role })
    .eq("user_id", userId);

  if (roleError) {
    return { error: roleError.message };
  }

  revalidatePath("/superadmin-portal");
  return {};
}

// ---------------------------------------------------------------------------
// deleteUser — delete from auth (cascades to profiles + user_roles via FK)
// ---------------------------------------------------------------------------
export async function deleteUser(userId: string): Promise<{ error?: string }> {
  const adminClient = createAdminClient();

  const { error } = await adminClient.auth.admin.deleteUser(userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/superadmin-portal");
  return {};
}
