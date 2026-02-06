-- Allow admins to delete customer accounts
CREATE OR REPLACE FUNCTION public.delete_user(_user_id UUID)
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

  IF auth.uid() = _user_id THEN
    RAISE EXCEPTION 'Cannot delete own account';
  END IF;

  IF public.has_role(_user_id, 'admin') THEN
    RAISE EXCEPTION 'Cannot delete admin accounts';
  END IF;

  DELETE FROM auth.users
  WHERE id = _user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;
