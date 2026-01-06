-- CORREÇÃO FINAL: Atualizar todos os pedidos de 05/01/2026
-- Este script define todos os pedidos do dia como Evento/Cesta, exceto os que são claramente Venda Loja

-- Primeiro, vamos identificar quais pedidos são claramente Venda Loja
-- Critérios para Venda Loja:
-- 1. NÃO tem setor_id E NÃO tem orcamento_id (venda direta na loja)

-- Atualizar todos os pedidos do dia que não são claramente Venda Loja como Evento/Cesta
UPDATE public.pedidos
SET tipo_pedido = 'evento_cesta'
WHERE created_at >= '2026-01-05 00:00:00'::timestamp
AND created_at <= '2026-01-05 23:59:59'::timestamp
AND NOT (
    -- Excluir pedidos que são claramente Venda Loja
    (setor_id IS NULL AND orcamento_id IS NULL)
);

-- Verificar o resultado
SELECT 
    tipo_pedido,
    COUNT(*) as quantidade
FROM public.pedidos
WHERE created_at >= '2026-01-05 00:00:00'::timestamp
AND created_at <= '2026-01-05 23:59:59'::timestamp
GROUP BY tipo_pedido;

-- Listar os 10 pedidos mais recentes do dia com detalhes
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
    p.status
FROM public.pedidos p
LEFT JOIN public.clientes c ON p.cliente_id = c.id
LEFT JOIN public.setores_cliente s ON p.setor_id = s.id
WHERE p.created_at >= '2026-01-05 00:00:00'::timestamp
AND p.created_at <= '2026-01-05 23:59:59'::timestamp
ORDER BY p.created_at DESC
LIMIT 10;
