-- Corrigir dois pedidos específicos que estão classificados incorretamente
-- Ambos deveriam ser "Pedidos de Evento ou Cesta" mas estão como "Venda Loja"

-- Pedido 1: Isbrae - Café Simples (05/01/2026 19:24)
-- Não tem setor, mas tem data de entrega diferente da criação
UPDATE public.pedidos
SET tipo_pedido = 'evento_cesta'
WHERE cliente_id IN (
    SELECT id FROM public.clientes WHERE nome = 'Isbrae'
)
AND created_at >= '2026-01-05 19:00:00'::timestamp
AND created_at <= '2026-01-05 20:00:00'::timestamp;

-- Pedido 2: Valdineia - Cesta de café da manhã com orçamento (05/01/2026 18:58)
-- Tem orcamento_id definido, o que indica claramente que é Evento/Cesta
UPDATE public.pedidos
SET tipo_pedido = 'evento_cesta'
WHERE cliente_id IN (
    SELECT id FROM public.clientes WHERE nome = 'Valdineia'
)
AND created_at >= '2026-01-05 18:00:00'::timestamp
AND created_at <= '2026-01-05 19:00:00'::timestamp;

-- Verificar se os pedidos foram atualizados
SELECT 
    id,
    tipo_pedido,
    cliente_id,
    setor_id,
    orcamento_id,
    created_at::date as data_criacao,
    data_hora_entrega::date as data_entrega,
    valor_total,
    CASE 
        WHEN created_at::date = data_hora_entrega::date THEN 'Mesmo dia'
        ELSE 'Dias diferentes'
    END as comparacao_data,
    CASE 
        WHEN orcamento_id IS NOT NULL THEN 'Com orçamento'
        ELSE 'Sem orçamento'
    END as tem_orcamento
FROM public.pedidos
WHERE created_at >= '2026-01-05 18:00:00'::timestamp
ORDER BY created_at DESC;
