-- Função para atualizar o metadata do usuário no Supabase Auth
-- Isso permite atualizar o display name (full_name) que aparece no painel do Supabase

CREATE OR REPLACE FUNCTION public.update_user_metadata(
  p_user_id UUID,
  p_full_name TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar o raw_user_meta_data do usuário no auth.users
  UPDATE auth.users
  SET 
    raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{full_name}',
      to_jsonb(p_full_name)
    )
  WHERE id = p_user_id AND p_full_name IS NOT NULL;
  
  -- Se avatar_url foi fornecido, atualizar também
  IF p_avatar_url IS NOT NULL THEN
    UPDATE auth.users
    SET 
      raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{avatar_url}',
        to_jsonb(p_avatar_url)
      )
    WHERE id = p_user_id;
  END IF;
END;
$$;

-- Grant permissão para usuários autenticados executarem a função
GRANT EXECUTE ON FUNCTION public.update_user_metadata(UUID, TEXT, TEXT) TO authenticated;
