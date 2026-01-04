-- Adicionar campo de contato à tabela setores_cliente

-- Verificar se a coluna contato existe, se não, adicionar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema='public' 
        AND table_name='setores_cliente' 
        AND column_name='contato'
    ) THEN
        ALTER TABLE public.setores_cliente ADD COLUMN contato TEXT;
    END IF;
END $$;

-- Criar índice para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_setores_cliente_cliente_id ON public.setores_cliente(cliente_id);
