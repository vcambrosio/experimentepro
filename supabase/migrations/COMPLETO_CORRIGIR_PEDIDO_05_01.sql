-- SCRIPT COMPLETO: Criar campo tipo_pedido E corrigir o pedido do dia 05/01/2026 às 18:58
-- Execute este script no SQL Editor do Supabase

-- PASSO 1: Adicionar o campo tipo_pedido se não existir
DO $$
BEGIN
    IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'pedidos'
            AND column_name = 'tipo_pedido'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.pedidos
            ADD COLUMN tipo_pedido TEXT DEFAULT 'evento_cesta';
            
            -- Adicionar comentário ao campo
            COMMENT ON COLUMN public.pedidos.tipo_pedido IS 'Tipo de pedido: venda_loja (venda imediata na loja) ou evento_cesta (pedido com entrega agendada)';
            
            RAISE NOTICE 'Campo tipo_pedido criado com sucesso';
        ELSE
            RAISE NOTICE 'Campo tipo_pedido já existe';
        END IF;
END $$;

-- PASSO 2: Atualizar o pedido do dia 05/01/2026 às 18:58 para tipo_pedido = 'evento_cesta'
UPDATE public.pedidos
SET tipo_pedido = 'evento_cesta'
WHERE created_at >= '2026-01-05 18:58:00'::timestamp
AND created_at <= '2026-01-05 18:59:00'::timestamp;

-- PASSO 3: Verificar o resultado
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
