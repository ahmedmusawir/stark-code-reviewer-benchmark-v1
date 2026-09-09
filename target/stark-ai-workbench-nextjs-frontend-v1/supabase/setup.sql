-- =============================================================================
-- Pro RBAC Next.js Starter Kit — Supabase Database Setup
-- =============================================================================
-- Run this entire file in the Supabase SQL Editor to set up the database schema.
-- Order matters — run top to bottom.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- STEP 1: AppRole enum
-- -----------------------------------------------------------------------------
-- Defines the three application roles. This enum is the canonical type used
-- in the user_roles table.

CREATE TYPE public.app_role AS ENUM ('superadmin', 'admin', 'member');


-- -----------------------------------------------------------------------------
-- STEP 2: user_roles table
-- -----------------------------------------------------------------------------
-- Stores the authoritative role assignment for every auth user.
-- This is the source of truth for authorization — NOT user_metadata.

CREATE TABLE public.user_roles (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role       public.app_role NOT NULL DEFAULT 'member',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own role only
CREATE POLICY "Users can read their own role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role (admin client) handles all inserts/updates — no anon/user policy needed


-- -----------------------------------------------------------------------------
-- STEP 3: profiles table
-- -----------------------------------------------------------------------------
-- Stores a public-facing profile for every auth user.
-- Synced automatically via the handle_new_user() trigger below.

CREATE TABLE public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name   text,
  email       text,
  created_at  timestamp with time zone DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own profile
CREATE POLICY "Users can read their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Service role (admin client) handles inserts via trigger — no insert policy needed for users


-- -----------------------------------------------------------------------------
-- STEP 4: handle_new_user() trigger function
-- -----------------------------------------------------------------------------
-- Fires on every INSERT into auth.users.
-- Automatically creates:
--   1. A row in public.user_roles  with default role = 'member'
--   2. A row in public.profiles    with email + full_name from user_metadata
--
-- IMPORTANT: Do NOT manually insert into user_roles or profiles when creating
-- users via supabase.auth.admin.createUser(). This trigger handles it.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert default member role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');

  -- Insert profile row with email and optional full_name from metadata
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'name'
  );

  RETURN NEW;
END;
$$;

-- Attach the trigger to auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- -----------------------------------------------------------------------------
-- STEP 5: Promote first superadmin
-- -----------------------------------------------------------------------------
-- After running this file, manually promote the first superadmin:
--
--   UPDATE public.user_roles
--   SET role = 'superadmin'
--   WHERE user_id = '<your-auth-user-uuid>';
--
-- You can find your UUID in Supabase → Authentication → Users.
-- This is a one-time manual operation. All future admins are created via
-- the Superadmin Portal UI.
-- =============================================================================
