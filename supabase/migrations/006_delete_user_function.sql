-- Função para deletar usuário do Auth (requer SECURITY DEFINER)
-- Esta função deleta o usuário do auth.users, o que em cascade deleta o profile e user_roles
CREATE OR REPLACE FUNCTION public.delete_user(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deletar do auth.users (CASCADE vai deletar profile e user_roles)
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

-- Grant permissão para usuários autenticados executarem a função
GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;
