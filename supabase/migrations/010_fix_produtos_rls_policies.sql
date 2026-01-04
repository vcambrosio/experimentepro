-- Corrigir políticas RLS da tabela produtos
-- Este arquivo cria as políticas necessárias para permitir operações CRUD na tabela produtos

-- Habilitar RLS na tabela produtos (se ainda não estiver habilitado)
ALTER TABLE IF EXISTS public.produtos ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.produtos;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.produtos;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.produtos;
DROP POLICY IF EXISTS "Permitir leitura de produtos" ON public.produtos;
DROP POLICY IF EXISTS "Permitir inserção de produtos" ON public.produtos;
DROP POLICY IF EXISTS "Permitir atualização de produtos" ON public.produtos;
DROP POLICY IF EXISTS "Permitir exclusão de produtos" ON public.produtos;

-- Política para permitir leitura para todos os usuários autenticados
CREATE POLICY "Permitir leitura de produtos"
  ON public.produtos
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para permitir inserção para todos os usuários autenticados
CREATE POLICY "Permitir inserção de produtos"
  ON public.produtos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para permitir atualização para todos os usuários autenticados
CREATE POLICY "Permitir atualização de produtos"
  ON public.produtos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para permitir exclusão para todos os usuários autenticados
CREATE POLICY "Permitir exclusão de produtos"
  ON public.produtos
  FOR DELETE
  TO authenticated
  USING (true);

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_produtos_categoria_id ON public.produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON public.produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_nome ON public.produtos(nome);
