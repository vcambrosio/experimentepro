-- Corrigir o tipo da coluna role na tabela user_roles
-- Se a coluna já existe com tipo diferente, vamos recriar a tabela

-- Primeiro, vamos verificar se a tabela existe e recriar com o tipo correto
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- Recriar a tabela com o tipo correto
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Criar índice para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função SECURITY DEFINER para criar roles (bypass RLS)
CREATE OR REPLACE FUNCTION public.create_user_role(p_user_id UUID, p_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id) DO UPDATE SET role = p_role;
END;
$$;

-- Política para permitir leitura para todos os usuários autenticados
DROP POLICY IF EXISTS "Permitir leitura de user_roles" ON public.user_roles;
CREATE POLICY "Permitir leitura de user_roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para permitir inserção para administradores
DROP POLICY IF EXISTS "Permitir inserção de user_roles para admins" ON public.user_roles;
CREATE POLICY "Permitir inserção de user_roles para admins"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Política para permitir atualização para administradores
DROP POLICY IF EXISTS "Permitir atualização de user_roles para admins" ON public.user_roles;
CREATE POLICY "Permitir atualização de user_roles para admins"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Política para permitir que usuários leiam seu próprio role
DROP POLICY IF EXISTS "Permitir leitura do próprio role" ON public.user_roles;
CREATE POLICY "Permitir leitura do próprio role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
