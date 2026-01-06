-- Atualizar pedidos antigos para usar o novo campo tipo_pedido
-- Execute este script para classificar corretamente os pedidos existentes

-- Atualizar pedidos que eram vendas de loja (sem setor definido)
UPDATE public.pedidos
SET tipo_pedido = 'venda_loja'
WHERE setor_id IS NULL;

-- Verificar a distribuição após a atualização
SELECT 
    tipo_pedido,
    COUNT(*) as quantidade,
    COUNT(CASE WHEN created_at::date = data_hora_entrega::date THEN 1 END) as mesmo_dia
FROM public.pedidos
GROUP BY tipo_pedido;

-- Mostrar exemplos de cada tipo
SELECT 
    id,
    tipo_pedido,
    cliente_id,
    setor_id,
    created_at::date as data_criacao,
    data_hora_entrega::date as data_entrega,
    CASE 
        WHEN created_at::date = data_hora_entrega::date THEN 'Mesmo dia'
        ELSE 'Dias diferentes'
    END as comparacao_data
FROM public.pedidos
ORDER BY created_at DESC
LIMIT 10;
