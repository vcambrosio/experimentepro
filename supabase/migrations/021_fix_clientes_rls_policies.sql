-- Corrigir as políticas RLS da tabela clientes
-- Garantir que usuários autenticados possam excluir clientes

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir inserção de clientes" ON public.clientes;
DROP POLICY IF EXISTS "Permitir atualização de clientes" ON public.clientes;
DROP POLICY IF EXISTS "Permitir exclusão de clientes" ON public.clientes;
DROP POLICY IF EXISTS "Permitir leitura de clientes" ON public.clientes;

-- Política para permitir leitura para todos os usuários autenticados
CREATE POLICY "Permitir leitura de clientes"
  ON public.clientes
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para permitir inserção para todos os usuários autenticados
CREATE POLICY "Permitir inserção de clientes"
  ON public.clientes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para permitir atualização para todos os usuários autenticados
CREATE POLICY "Permitir atualização de clientes"
  ON public.clientes
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para permitir exclusão para todos os usuários autenticados
CREATE POLICY "Permitir exclusão de clientes"
  ON public.clientes
  FOR DELETE
  TO authenticated
  USING (true);

-- Corrigir as políticas RLS da tabela setores_cliente
-- Garantir que usuários autenticados possam excluir setores

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir inserção de setores_cliente" ON public.setores_cliente;
DROP POLICY IF EXISTS "Permitir atualização de setores_cliente" ON public.setores_cliente;
DROP POLICY IF EXISTS "Permitir exclusão de setores_cliente" ON public.setores_cliente;
DROP POLICY IF EXISTS "Permitir leitura de setores_cliente" ON public.setores_cliente;

-- Política para permitir leitura para todos os usuários autenticados
CREATE POLICY "Permitir leitura de setores_cliente"
  ON public.setores_cliente
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para permitir inserção para todos os usuários autenticados
CREATE POLICY "Permitir inserção de setores_cliente"
  ON public.setores_cliente
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para permitir atualização para todos os usuários autenticados
CREATE POLICY "Permitir atualização de setores_cliente"
  ON public.setores_cliente
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para permitir exclusão para todos os usuários autenticados
CREATE POLICY "Permitir exclusão de setores_cliente"
  ON public.setores_cliente
  FOR DELETE
  TO authenticated
  USING (true);
