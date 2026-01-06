-- CORRIGIR O PEDIDO ESPECÍFICO
-- ID: 97f05edf-1097-40b3-b59b-d69f7d7ae2d3
-- Execute este script no SQL Editor do Supabase

-- Atualizar o pedido para tipo_pedido = 'evento_cesta'
UPDATE public.pedidos
SET tipo_pedido = 'evento_cesta'
WHERE id = '97f05edf-1097-40b3-b59b-d69f7d7ae2d3';

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
    p.created_at,
    p.data_hora_entrega,
    p.valor_total,
    p.status
FROM public.pedidos p
LEFT JOIN public.clientes c ON p.cliente_id = c.id
LEFT JOIN public.setores_cliente s ON p.setor_id = s.id
WHERE p.id = '97f05edf-1097-40b3-b59b-d69f7d7ae2d3';
