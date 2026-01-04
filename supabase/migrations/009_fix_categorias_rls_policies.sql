-- Corrigir políticas RLS da tabela categorias
-- Este arquivo cria as políticas necessárias para permitir operações CRUD na tabela categorias

-- Habilitar RLS na tabela categorias (se ainda não estiver habilitado)
ALTER TABLE IF EXISTS public.categorias ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.categorias;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.categorias;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.categorias;
DROP POLICY IF EXISTS "Permitir leitura de categorias" ON public.categorias;
DROP POLICY IF EXISTS "Permitir inserção de categorias" ON public.categorias;
DROP POLICY IF EXISTS "Permitir atualização de categorias" ON public.categorias;
DROP POLICY IF EXISTS "Permitir exclusão de categorias" ON public.categorias;

-- Política para permitir leitura para todos os usuários autenticados
CREATE POLICY "Permitir leitura de categorias"
  ON public.categorias
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para permitir inserção para todos os usuários autenticados
CREATE POLICY "Permitir inserção de categorias"
  ON public.categorias
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para permitir atualização para todos os usuários autenticados
CREATE POLICY "Permitir atualização de categorias"
  ON public.categorias
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para permitir exclusão para todos os usuários autenticados
CREATE POLICY "Permitir exclusão de categorias"
  ON public.categorias
  FOR DELETE
  TO authenticated
  USING (true);

-- Criar índice para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_categorias_nome ON public.categorias(nome);
CREATE INDEX IF NOT EXISTS idx_categorias_ativo ON public.categorias(ativo);
