-- CORREÇÃO DEFINITIVA: Atualizar todos os pedidos de 05/01/2026
-- Execute este script para corrigir a classificação dos pedidos

-- Pedidos de Isbrae e Valdineia devem ser classificados como Evento/Cesta
-- porque:
-- 1. Isbrae: Não tem setor, mas tem data de entrega diferente da criação (compra agendada)
-- 2. Valdineia: Tem orcamento_id definido (pedido criado a partir de orçamento)

UPDATE public.pedidos
SET tipo_pedido = 'evento_cesta'
WHERE created_at >= '2026-01-05 00:00:00'::timestamp
AND created_at <= '2026-01-05 23:59:59'::timestamp
AND (
    -- Isbrae: Cliente "Isbrae", sem setor, data de entrega diferente da criação
    (cliente_id IN (SELECT id FROM public.clientes WHERE nome = 'Isbrae')
    AND setor_id IS NULL
    AND created_at::date <> data_hora_entrega::date)
    OR
    -- Valdineia: Cliente "Valdineia", tem orcamento_id
    (cliente_id IN (SELECT id FROM public.clientes WHERE nome = 'Valdineia')
    AND orcamento_id IS NOT NULL)
);

-- Verificar o resultado
SELECT 
    tipo_pedido,
    COUNT(*) as quantidade
FROM public.pedidos
WHERE created_at >= '2026-01-05 00:00:00'::timestamp
AND created_at <= '2026-01-05 23:59:59'::timestamp
GROUP BY tipo_pedido;

-- Listar os pedidos atualizados para verificação
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
