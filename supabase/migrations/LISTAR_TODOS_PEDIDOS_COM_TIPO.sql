-- LISTAR TODOS OS PEDIDOS COM SEUS TIPOS
-- Execute este script para identificar qual pedido está com o tipo errado

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
    p.created_at::time as hora_criacao,
    p.data_hora_entrega::date as data_entrega,
    p.data_hora_entrega::time as hora_entrega,
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
ORDER BY p.created_at DESC;
