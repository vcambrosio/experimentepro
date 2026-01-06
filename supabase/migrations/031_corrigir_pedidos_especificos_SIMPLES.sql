-- CORREÇÃO SIMPLES: Atualizar APENAS os pedidos específicos de 05/01/2026
-- Atualiza os pedidos de Isbrae e Valdineia usando o ID exato

-- Atualizar pedido de Isbrae (ID deve ser verificado primeiro)
UPDATE public.pedidos
SET tipo_pedido = 'evento_cesta'
WHERE id = 'COLOQUE_O_ID_DO_PEDIDO_DE_ISBRAE_AQUI';

-- Atualizar pedido de Valdineia (ID deve ser verificado primeiro)
UPDATE public.pedidos
SET tipo_pedido = 'evento_cesta'
WHERE id = 'COLOQUE_O_ID_DO_PEDIDO_DE_VALDINEIA_AQUI';

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
    p.valor_total
FROM public.pedidos p
LEFT JOIN public.clientes c ON p.cliente_id = c.id
LEFT JOIN public.setores_cliente s ON p.setor_id = s.id
WHERE p.created_at >= '2026-01-05 00:00:00'::timestamp
AND p.created_at <= '2026-01-05 23:59:59'::timestamp
ORDER BY p.created_at DESC;

-- Para encontrar os IDs corretos, execute primeiro:
SELECT id, created_at, c.nome 
FROM public.pedidos p
LEFT JOIN public.clientes c ON p.cliente_id = c.id
WHERE p.created_at >= '2026-01-05 00:00:00'::timestamp
AND p.created_at <= '2026-01-05 23:59:59'::timestamp
AND (
    c.nome = 'Isbrae'
    OR c.nome LIKE '%isbrae%'
    OR c.nome LIKE '%í%s%'
)
ORDER BY p.created_at DESC;
