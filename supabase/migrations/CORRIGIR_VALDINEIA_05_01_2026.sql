-- CORREÇÃO SIMPLES: Atualizar apenas o pedido de Valdineia de 05/01/2026
-- Este pedido tem orcamento_id definido, o que indica claramente que é Evento/Cesta

-- Atualizar o pedido de Valdineia (tem orcamento_id às 18:58)
UPDATE public.pedidos
SET tipo_pedido = 'evento_cesta'
WHERE created_at >= '2026-01-05 18:58:00'::timestamp
AND created_at <= '2026-01-05 18:59:00'::timestamp
AND cliente_id IN (SELECT id FROM public.clientes WHERE nome = 'Valdineia')
AND orcamento_id IS NOT NULL;

-- Verificar se o pedido foi atualizado
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
    p.created_at,
    p.data_hora_entrega,
    p.valor_total,
    p.status,
    p.status_pagamento
FROM public.pedidos p
LEFT JOIN public.clientes c ON p.cliente_id = c.id
LEFT JOIN public.setores_cliente s ON p.setor_id = s.id
WHERE p.created_at >= '2026-01-05 18:58:00'::timestamp
AND p.created_at <= '2026-01-05 18:59:00'::timestamp
AND c.nome = 'Valdineia'
ORDER BY p.created_at DESC;
