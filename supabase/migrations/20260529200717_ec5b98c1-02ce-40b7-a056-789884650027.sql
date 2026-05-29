CREATE OR REPLACE FUNCTION public._tmp_export_auth_users()
RETURNS TABLE(id uuid, email text, created_at timestamptz, raw_user_meta_data jsonb)
LANGUAGE sql SECURITY DEFINER SET search_path = public, auth
AS $$ SELECT id, email::text, created_at, raw_user_meta_data FROM auth.users ORDER BY created_at $$;
REVOKE ALL ON FUNCTION public._tmp_export_auth_users() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._tmp_export_auth_users() TO postgres, service_role;