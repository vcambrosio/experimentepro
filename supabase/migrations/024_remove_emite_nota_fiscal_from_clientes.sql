-- Remover campo emite_nota_fiscal da tabela clientes
-- Este campo foi movido para a tabela pedidos

ALTER TABLE public.clientes 
DROP COLUMN IF EXISTS emite_nota_fiscal;
