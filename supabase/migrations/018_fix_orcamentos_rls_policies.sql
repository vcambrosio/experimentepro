-- Corrigir as políticas RLS da tabela orcamentos
-- Garantir que usuários autenticados possam excluir orçamentos

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir inserção de orçamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Permitir atualização de orçamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Permitir exclusão de orçamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Permitir leitura de orçamentos" ON public.orcamentos;

-- Política para permitir leitura para todos os usuários autenticados
CREATE POLICY "Permitir leitura de orçamentos"
  ON public.orcamentos
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para permitir inserção para todos os usuários autenticados
CREATE POLICY "Permitir inserção de orçamentos"
  ON public.orcamentos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para permitir atualização para todos os usuários autenticados
CREATE POLICY "Permitir atualização de orçamentos"
  ON public.orcamentos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para permitir exclusão para todos os usuários autenticados
CREATE POLICY "Permitir exclusão de orçamentos"
  ON public.orcamentos
  FOR DELETE
  TO authenticated
  USING (true);

-- Corrigir as políticas RLS da tabela itens_orcamento
-- Garantir que usuários autenticados possam excluir itens de orçamentos

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir inserção de itens_orcamento" ON public.itens_orcamento;
DROP POLICY IF EXISTS "Permitir atualização de itens_orcamento" ON public.itens_orcamento;
DROP POLICY IF EXISTS "Permitir exclusão de itens_orcamento" ON public.itens_orcamento;
DROP POLICY IF EXISTS "Permitir leitura de itens_orcamento" ON public.itens_orcamento;

-- Política para permitir leitura para todos os usuários autenticados
CREATE POLICY "Permitir leitura de itens_orcamento"
  ON public.itens_orcamento
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para permitir inserção para todos os usuários autenticados
CREATE POLICY "Permitir inserção de itens_orcamento"
  ON public.itens_orcamento
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para permitir atualização para todos os usuários autenticados
CREATE POLICY "Permitir atualização de itens_orcamento"
  ON public.itens_orcamento
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para permitir exclusão para todos os usuários autenticados
CREATE POLICY "Permitir exclusão de itens_orcamento"
  ON public.itens_orcamento
  FOR DELETE
  TO authenticated
  USING (true);
