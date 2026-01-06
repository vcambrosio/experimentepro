-- Adicionar campo tipo_pedido na tabela pedidos
-- Este campo permite diferenciar claramente entre vendas de loja e pedidos de evento/cesta

-- Adicionar o campo se não existir
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
    END IF;
END $$;

-- Criar índice para melhorar performance de consultas filtradas por tipo
CREATE INDEX IF NOT EXISTS idx_pedidos_tipo_pedido ON public.pedidos(tipo_pedido);
