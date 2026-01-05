-- Adicionar campo emite_nota_fiscal na tabela pedidos
-- Este campo permite que cada pedido tenha sua própria configuração de nota fiscal

ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS emite_nota_fiscal BOOLEAN DEFAULT false;

-- Adicionar comentário ao campo
COMMENT ON COLUMN public.pedidos.emite_nota_fiscal IS 'Indica se o pedido requer emissão de nota fiscal';
