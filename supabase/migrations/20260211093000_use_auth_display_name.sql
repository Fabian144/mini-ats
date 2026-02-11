-- ============================================================
-- User identity management: display_name in auth metadata
-- Email and display_name are the source of truth (in auth.users)
-- This migration adds:
--   1. Migration helper for existing users (full_name → display_name)
--   2. Functions for users to update their own identity
--   3. Functions for admins to update customer identity
--   4. Admin RPC to list users with their info
-- ============================================================

-- Migrate existing users: copy full_name → display_name if not already set
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{display_name}',
  to_jsonb(COALESCE(raw_user_meta_data->>'display_name', raw_user_meta_data->>'full_name')),
  true
)
WHERE raw_user_meta_data->>'display_name' IS NULL 
  AND raw_user_meta_data->>'full_name' IS NOT NULL;

-- ============================================================
-- Identity update functions
-- ============================================================

-- Drop old signatures that used _full_name parameter
DROP FUNCTION IF EXISTS public.update_own_identity(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.admin_update_customer_identity(UUID, TEXT, TEXT);

-- Users can update their own email and display_name
CREATE OR REPLACE FUNCTION public.update_own_identity(_email TEXT, _display_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _email IS NULL AND _display_name IS NULL THEN
    RAISE EXCEPTION 'No changes requested';
  END IF;

  IF _email IS NOT NULL THEN
    UPDATE auth.users
    SET email = _email
    WHERE id = auth.uid();
  END IF;

  IF _display_name IS NOT NULL THEN
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{display_name}',
      to_jsonb(_display_name),
      true
    )
    WHERE id = auth.uid();
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_own_identity(TEXT, TEXT) TO authenticated;

-- Admins can update customer email and display_name (not other admins)
CREATE OR REPLACE FUNCTION public.admin_update_customer_identity(
  _user_id UUID,
  _email TEXT,
  _display_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF _email IS NULL AND _display_name IS NULL THEN
    RAISE EXCEPTION 'No changes requested';
  END IF;

  IF public.has_role(_user_id, 'admin') THEN
    RAISE EXCEPTION 'Cannot update admin accounts';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF _email IS NOT NULL THEN
    UPDATE auth.users
    SET email = _email
    WHERE id = _user_id;
  END IF;

  IF _display_name IS NOT NULL THEN
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{display_name}',
      to_jsonb(_display_name),
      true
    )
    WHERE id = _user_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_customer_identity(UUID, TEXT, TEXT) TO authenticated;

-- ============================================================
-- Admin listing function
-- ============================================================

-- Admins can list all users with their email and display_name
-- Falls back to full_name for legacy users
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (id UUID, email TEXT, display_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT u.id, u.email::TEXT, 
    COALESCE(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'full_name')
  FROM auth.users u;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
