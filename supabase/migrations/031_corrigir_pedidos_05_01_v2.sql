-- CORREÇÃO ROBUSTA: Atualizar pedidos de 05/01/2026
-- Este script verifica os clientes de várias formas para garantir que funcione

-- Atualizar pedidos de Isbrae (sem setor, data de entrega diferente da criação)
UPDATE public.pedidos
SET tipo_pedido = 'evento_cesta'
WHERE created_at >= '2026-01-05 00:00:00'::timestamp
AND created_at <= '2026-01-05 23:59:59'::timestamp
AND (
    -- Cliente "Isbrae" (exatamente)
    (cliente_id IN (SELECT id FROM public.clientes WHERE nome = 'Isbrae'))
    -- OU cliente com nome similar (Isbrae com ou sem acento)
    OR cliente_id IN (SELECT id FROM public.clientes WHERE LOWER(nome) LIKE '%isbrae%')
    -- OU cliente com nome similar (Isbrae com acento)
    OR cliente_id IN (SELECT id FROM public.clientes WHERE LOWER(nome) LIKE '%í%s%')
)
AND setor_id IS NULL
AND created_at::date <> data_hora_entrega::date
);

-- Atualizar pedidos de Valdineia (tem orcamento_id definido)
UPDATE public.pedidos
SET tipo_pedido = 'evento_cesta'
WHERE created_at >= '2026-01-05 00:00:00'::timestamp
AND created_at <= '2026-01-05 23:59:59'::timestamp
AND (
    -- Cliente "Valdineia" (exatamente)
    (cliente_id IN (SELECT id FROM public.clientes WHERE nome = 'Valdineia'))
    -- OU cliente com nome similar (Valdineia com ou sem acento)
    OR cliente_id IN (SELECT id FROM public.clientes WHERE LOWER(nome) LIKE '%valdineia%')
    -- OU cliente com nome similar (Valdineia com acento)
    OR cliente_id IN (SELECT id FROM public.clientes WHERE LOWER(nome) LIKE '%valdín%ia%')
)
AND orcamento_id IS NOT NULL;

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

-- Mostrar todos os clientes que contém "isbrae" ou "valdineia" para referência
SELECT 
    id,
    nome,
    LOWER(nome) as nome_minusculo
FROM public.clientes
WHERE LOWER(nome) LIKE '%isbrae%' 
   OR LOWER(nome) LIKE '%valdineia%';
