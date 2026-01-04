-- Criar função para inserir usuário admin inicial
-- Esta função deve ser executada manualmente via SQL Editor no Supabase
-- ou via API com service_role key

-- Instruções:
-- 1. Para criar o usuário admin inicial, execute o seguinte no SQL Editor:
-- 
-- SELECT create_initial_admin_user('admin@suaempresa.com', 'senha_segura', 'Administrador');
--
-- 2. Ou use a API com service_role key:
-- 
-- POST /auth/v1/admin/users
-- {
--   "email": "admin@suaempresa.com",
--   "password": "senha_segura",
--   "email_confirm": true,
--   "user_metadata": {
--     "full_name": "Administrador"
--   }
-- }
--
-- 3. Depois crie o role admin:
--
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('<user_id_do_admin>', 'admin');

-- Função auxiliar para criar usuário admin (requer service_role)
CREATE OR REPLACE FUNCTION public.create_initial_admin_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Criar usuário no Auth
  INSERT INTO auth.users (
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data
  )
  VALUES (
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(),
    jsonb_build_object('full_name', p_full_name),
    '{"provider":"email","providers":["email"]}'::jsonb
  )
  RETURNING id INTO v_user_id;
  
  -- O profile será criado automaticamente pelo trigger
  
  -- Criar role admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin');
  
  RETURN v_user_id;
END;
$$;

-- Criar função para verificar se já existe um admin
CREATE OR REPLACE FUNCTION public.has_admin_users()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE role = 'admin'
    LIMIT 1
  );
END;
$$;
