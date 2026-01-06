-- Listar todos os pedidos de 05/01/2026 para identificar os IDs corretos
-- Execute este script para ver todos os pedidos do dia e identificar quais são Isbrae e Valdineia

SELECT 
    id,
    cliente_id,
    setor_id,
    orcamento_id,
    tipo_pedido,
    created_at,
    data_hora_entrega,
    created_at::date as data_criacao,
    data_hora_entrega::date as data_entrega,
    valor_total,
    status,
    status_pagamento,
    CASE 
        WHEN created_at::date = data_hora_entrega::date THEN 'Mesmo dia'
        ELSE 'Dias diferentes'
    END as comparacao_data,
    CASE 
        WHEN orcamento_id IS NOT NULL THEN 'Com orçamento'
        ELSE 'Sem orçamento'
    END as tem_orcamento,
    CASE 
        WHEN setor_id IS NOT NULL THEN 'Com setor'
        ELSE 'Sem setor'
    END as tem_setor
FROM public.pedidos
WHERE created_at >= '2026-01-05 00:00:00'::timestamp
AND created_at <= '2026-01-05 23:59:59'::timestamp
ORDER BY created_at DESC;

-- Mostrar também os nomes dos clientes para referência
SELECT 
    p.id as pedido_id,
    p.cliente_id,
    c.nome as cliente_nome,
    p.tipo_pedido,
    p.setor_id,
    p.orcamento_id,
    p.created_at,
    p.data_hora_entrega,
    p.valor_total
FROM public.pedidos p
JOIN public.clientes c ON p.cliente_id = c.id
WHERE p.created_at >= '2026-01-05 00:00:00'::timestamp
AND p.created_at <= '2026-01-05 23:59:59'::timestamp
ORDER BY p.created_at DESC;
