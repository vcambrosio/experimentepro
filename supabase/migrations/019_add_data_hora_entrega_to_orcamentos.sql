-- Adicionar campos de data e hora de entrega à tabela orcamentos
-- Esses campos serão usados quando o orçamento for convertido em pedido

-- Adicionar campo data_entrega (opcional)
ALTER TABLE public.orcamentos
ADD COLUMN IF NOT EXISTS data_entrega DATE;

-- Adicionar campo hora_entrega (opcional)
ALTER TABLE public.orcamentos
ADD COLUMN IF NOT EXISTS hora_entrega TEXT;

-- Criar índice para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_orcamentos_data_entrega 
ON public.orcamentos(data_entrega);
