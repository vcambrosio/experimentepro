-- CORREÇÃO DOS PEDIDOS DE 05/01/2026
-- Script direto e robusto para corrigir os pedidos de Isbrae e Valdineia

-- PASSO 1: Atualizar pedido de Valdineia (tem orcamento_id às 18:58)
UPDATE public.pedidos
SET tipo_pedido = 'evento_cesta'
WHERE created_at >= '2026-01-05 18:58:00'::timestamp
AND created_at <= '2026-01-05 18:59:00'::timestamp
AND cliente_id IN (SELECT id FROM public.clientes WHERE nome = 'Valdineia')
AND orcamento_id IS NOT NULL;

-- PASSO 2: Atualizar pedido de Isbrae (sem setor às 19:24)
UPDATE public.pedidos
SET tipo_pedido = 'evento_cesta'
WHERE created_at >= '2026-01-05 19:24:00'::timestamp
AND created_at <= '2026-01-05 19:29:00'::timestamp
AND cliente_id IN (SELECT id FROM public.clientes WHERE nome = 'Isbrae')
AND setor_id IS NULL
AND created_at::date <> data_hora_entrega::date;

-- VERIFICAÇÃO FINAL
SELECT 
    'SUCESSO: Pedidos atualizados' as resultado,
    JSON_AGG(
        JSON_BUILD_OBJECT(
            'pedido_valdineia', p.id,
            'pedido_isbrae', (SELECT id FROM public.pedidos 
                WHERE created_at >= '2026-01-05 18:58:00'::timestamp
                AND created_at <= '2026-01-05 18:59:00'::timestamp
                AND cliente_id IN (SELECT id FROM public.clientes WHERE nome = 'Valdineia')
                AND orcamento_id IS NOT NULL
                LIMIT 1),
            'pedido_isbrae', (SELECT id FROM public.pedidos 
                WHERE created_at >= '2026-01-05 19:24:00'::timestamp
                AND created_at <= '2026-01-05 19:29:00'::timestamp
                AND cliente_id IN (SELECT id FROM public.clientes WHERE nome = 'Isbrae')
                AND setor_id IS NULL
                AND created_at::date <> data_hora_entrega::date
                LIMIT 1)
        ) as pedidos_atualizados
FROM (SELECT 1)
) as resultado;
