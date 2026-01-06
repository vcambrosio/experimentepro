-- CORREÇÃO DO PEDIDO DO DIA 05/01/2026 ÀS 18:58
-- Execute este script no SQL Editor do Supabase

-- Atualizar o pedido das 18:58 para tipo_pedido = 'evento_cesta'
UPDATE public.pedidos
SET tipo_pedido = 'evento_cesta'
WHERE created_at >= '2026-01-05 18:58:00'::timestamp
AND created_at <= '2026-01-05 18:59:00'::timestamp;

-- Verificar o resultado
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
