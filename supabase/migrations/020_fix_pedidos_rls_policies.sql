-- Corrigir as políticas RLS da tabela pedidos
-- Garantir que usuários autenticados possam excluir pedidos

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir inserção de pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Permitir atualização de pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Permitir exclusão de pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Permitir leitura de pedidos" ON public.pedidos;

-- Política para permitir leitura para todos os usuários autenticados
CREATE POLICY "Permitir leitura de pedidos"
  ON public.pedidos
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para permitir inserção para todos os usuários autenticados
CREATE POLICY "Permitir inserção de pedidos"
  ON public.pedidos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para permitir atualização para todos os usuários autenticados
CREATE POLICY "Permitir atualização de pedidos"
  ON public.pedidos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para permitir exclusão para todos os usuários autenticados
CREATE POLICY "Permitir exclusão de pedidos"
  ON public.pedidos
  FOR DELETE
  TO authenticated
  USING (true);

-- Corrigir as políticas RLS da tabela itens_pedido
-- Garantir que usuários autenticados possam excluir itens de pedidos

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir inserção de itens_pedido" ON public.itens_pedido;
DROP POLICY IF EXISTS "Permitir atualização de itens_pedido" ON public.itens_pedido;
DROP POLICY IF EXISTS "Permitir exclusão de itens_pedido" ON public.itens_pedido;
DROP POLICY IF EXISTS "Permitir leitura de itens_pedido" ON public.itens_pedido;

-- Política para permitir leitura para todos os usuários autenticados
CREATE POLICY "Permitir leitura de itens_pedido"
  ON public.itens_pedido
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para permitir inserção para todos os usuários autenticados
CREATE POLICY "Permitir inserção de itens_pedido"
  ON public.itens_pedido
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para permitir atualização para todos os usuários autenticados
CREATE POLICY "Permitir atualização de itens_pedido"
  ON public.itens_pedido
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para permitir exclusão para todos os usuários autenticados
CREATE POLICY "Permitir exclusão de itens_pedido"
  ON public.itens_pedido
  FOR DELETE
  TO authenticated
  USING (true);
