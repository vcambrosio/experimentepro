-- Restaurar o role de administrador para o usuário vcambrosio@gmail.com
-- Esta migration corrige o problema de perder o role ao recriar a tabela user_roles

-- Primeiro, vamos buscar o ID do usuário pelo email
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Buscar o ID do usuário pelo email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'vcambrosio@gmail.com'
  LIMIT 1;

  -- Se encontrou o usuário e ele não tem role, criar como admin
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
    
    RAISE NOTICE 'Role de administrador restaurado para o usuário %', v_user_id;
  END IF;
END $$;
