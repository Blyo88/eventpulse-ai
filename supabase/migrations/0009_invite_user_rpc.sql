-- Sprint 8: Función RPC segura para verificar existencia de usuario por email
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;
  
  RETURN v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) TO authenticated;