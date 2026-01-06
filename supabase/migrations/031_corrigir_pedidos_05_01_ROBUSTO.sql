-- CORREÇÃO ROBUSTA: Atualizar pedidos de 05/01/2026
-- Estratégia em duas etapas para garantir classificação correta

-- ETAPA 1: Definir todos os pedidos do dia como 'evento_cesta' por padrão
UPDATE public.pedidos
SET tipo_pedido = 'evento_cesta'
WHERE created_at >= '2026-01-05 00:00:00'::timestamp
AND created_at <= '2026-01-05 23:59:59'::timestamp;

-- ETAPA 2: Atualizar apenas os que são claramente 'venda_loja'
-- Critérios para venda_loja:
-- 1. NÃO tem setor_id (venda direta na loja)
-- 2. NÃO tem orcamento_id (não veio de orçamento)
UPDATE public.pedidos
SET tipo_pedido = 'venda_loja'
WHERE created_at >= '2026-01-05 00:00:00'::timestamp
AND created_at <= '2026-01-05 23:59:59'::timestamp
AND setor_id IS NULL
AND orcamento_id IS NULL;

-- Verificar o resultado final
SELECT 
    tipo_pedido,
    COUNT(*) as quantidade,
    STRING_AGG(DISTINCT c.nome, ', ' ORDER BY c.nome LIMIT 5') as exemplo_clientes
FROM public.pedidos p
LEFT JOIN public.clientes c ON p.cliente_id = c.id
WHERE p.created_at >= '2026-01-05 00:00:00'::timestamp
AND p.created_at <= '2026-01-05 23:59:59'::timestamp
GROUP BY p.tipo_pedido
ORDER BY p.tipo_pedido;

-- Listar os 10 pedidos mais recentes do dia para verificação
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
