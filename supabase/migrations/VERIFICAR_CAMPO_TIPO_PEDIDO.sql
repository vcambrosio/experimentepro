-- VERIFICAR SE O CAMPO tipo_pedido EXISTE E QUAL É O VALOR DO PEDIDO

-- PASSO 1: Verificar se o campo tipo_pedido existe na tabela pedidos
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'pedidos'
AND table_schema = 'public'
AND column_name = 'tipo_pedido';

-- PASSO 2: Verificar o pedido do dia 05/01/2026 às 18:58
SELECT 
    p.id,
    p.tipo_pedido,
    c.nome as cliente,
    s.nome_setor as setor,
    p.orcamento_id,
    p.created_at,
    p.data_hora_entrega,
    p.valor_total,
    p.status
FROM public.pedidos p
LEFT JOIN public.clientes c ON p.cliente_id = c.id
LEFT JOIN public.setores_cliente s ON p.setor_id = s.id
WHERE p.created_at >= '2026-01-05 18:58:00'::timestamp
AND p.created_at <= '2026-01-05 18:59:00'::timestamp
ORDER BY p.created_at DESC;

-- PASSO 3: Contar quantos pedidos têm cada tipo_pedido
SELECT 
    tipo_pedido,
    COUNT(*) as quantidade
FROM public.pedidos
GROUP BY tipo_pedido;
