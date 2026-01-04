-- Adicionar campo descricao à tabela orcamentos
-- Este campo será usado para uma descrição geral do orçamento

-- Adicionar campo descricao (opcional)
ALTER TABLE public.orcamentos
ADD COLUMN IF NOT EXISTS descricao TEXT;
