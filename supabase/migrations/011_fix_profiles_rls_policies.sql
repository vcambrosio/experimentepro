-- Corrigir políticas RLS da tabela profiles
-- Este arquivo cria as políticas necessárias para permitir operações CRUD na tabela profiles

-- Habilitar RLS na tabela profiles (se ainda não estiver habilitado)
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir atualização do próprio profile" ON public.profiles;
DROP POLICY IF EXISTS "Permitir leitura de profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

-- Política para permitir leitura para todos os usuários autenticados
CREATE POLICY "Permitir leitura de profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para permitir que usuários autenticados atualizem qualquer profile
-- (Admins precisam poder atualizar profiles de outros usuários)
CREATE POLICY "Permitir atualização de profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para permitir que usuários autenticados atualizem seu próprio profile
CREATE POLICY "Permitir atualização do próprio profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);
