-- Allow users to update their own email and username (full_name)
CREATE OR REPLACE FUNCTION public.update_own_identity(_email TEXT, _full_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _email IS NULL AND _full_name IS NULL THEN
    RAISE EXCEPTION 'No changes requested';
  END IF;

  IF _email IS NOT NULL THEN
    UPDATE auth.users
    SET email = _email
    WHERE id = auth.uid();
  END IF;

  IF _full_name IS NOT NULL THEN
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{full_name}',
      to_jsonb(_full_name),
      true
    )
    WHERE id = auth.uid();
  END IF;

  UPDATE public.profiles
  SET
    email = COALESCE(_email, email),
    full_name = COALESCE(_full_name, full_name)
  WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_own_identity(TEXT, TEXT) TO authenticated;

-- Allow admins to update customer email and username (not other admins)
CREATE OR REPLACE FUNCTION public.admin_update_customer_identity(
  _user_id UUID,
  _email TEXT,
  _full_name TEXT
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

  IF _email IS NULL AND _full_name IS NULL THEN
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

  IF _full_name IS NOT NULL THEN
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{full_name}',
      to_jsonb(_full_name),
      true
    )
    WHERE id = _user_id;
  END IF;

  UPDATE public.profiles
  SET
    email = COALESCE(_email, email),
    full_name = COALESCE(_full_name, full_name)
  WHERE user_id = _user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_customer_identity(UUID, TEXT, TEXT) TO authenticated;
