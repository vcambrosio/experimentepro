-- Adicionar campo tipo_calculo à tabela checklist_itens
-- Este campo define como a quantidade do item é calculada:
-- 'unitario': quantidade fixa independente da quantidade do produto no pedido
-- 'multiplo': quantidade multiplicada pela quantidade do produto no pedido

ALTER TABLE public.checklist_itens
ADD COLUMN IF NOT EXISTS tipo_calculo TEXT NOT NULL DEFAULT 'multiplo'
CHECK (tipo_calculo IN ('unitario', 'multiplo'));

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.checklist_itens.tipo_calculo IS 'Define como a quantidade é calculada: "unitario" (fixa) ou "multiplo" (multiplicada pela quantidade do produto no pedido)';
