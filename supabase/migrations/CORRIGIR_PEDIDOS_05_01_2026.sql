-- CORREÇÃO SIMPLES E DIRETA: Atualizar pedidos de 05/01/2026
-- Execute este script no SQL Editor do Supabase

-- PASSO 1: Atualizar pedido de Valdineia (tem orcamento_id às 18:58)
UPDATE public.pedidos
SET tipo_pedido = 'evento_cesta'
WHERE cliente_id = (SELECT id FROM public.clientes WHERE nome = 'Valdineia')
AND created_at >= '2026-01-05 18:58:00'::timestamp
AND created_at <= '2026-01-05 18:59:00'::timestamp
AND orcamento_id IS NOT NULL;

-- PASSO 2: Atualizar pedido de Isbrae (sem setor às 19:24)
UPDATE public.pedidos
SET tipo_pedido = 'evento_cesta'
WHERE cliente_id = (SELECT id FROM public.clientes WHERE nome = 'Isbrae')
AND created_at >= '2026-01-05 19:24:00'::timestamp
AND created_at <= '2026-01-05 19:29:00'::timestamp
AND setor_id IS NULL
AND created_at::date <> data_hora_entrega::date;

-- Verificar o resultado
SELECT 
    p.id,
    p.tipo_pedido,
    c.nome as cliente,
    s.nome_setor as setor,
    p.orcamento_id,
    CASE 
        WHEN p.orcamento_id IS NOT NULL THEN 'Sim'
        ELSE 'Não'
    END as tem_orcamento,
    p.created_at::date as data_criacao,
    p.data_hora_entrega::date as data_entrega,
    CASE 
        WHEN p.created_at::date = p.data_hora_entrega::date THEN 'Mesmo dia'
        ELSE 'Dias diferentes'
    END as comparacao_data,
    p.valor_total,
    p.status,
    p.status_pagamento
FROM public.pedidos p
LEFT JOIN public.clientes c ON p.cliente_id = c.id
LEFT JOIN public.setores_cliente s ON p.setor_id = s.id
WHERE p.created_at >= '2026-01-05 18:00:00'::timestamp
AND p.created_at <= '2026-01-05 23:59:59'::timestamp
AND (
    c.nome = 'Isbrae'
    OR c.nome = 'Valdineia'
)
ORDER BY p.created_at DESC;
