-- Corrigir a restrição de chave estrangeira na tabela pedidos
-- Permite excluir setores mesmo quando há pedidos relacionados

-- Primeiro, verificar se a constraint existe
DO $$
BEGIN
    -- Remover a constraint antiga se existir
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_schema='public' 
        AND table_name='pedidos' 
        AND constraint_name='pedidos_setor_id_fkey'
    ) THEN
        ALTER TABLE public.pedidos DROP CONSTRAINT pedidos_setor_id_fkey;
    END IF;
END $$;

-- Criar nova constraint com ON DELETE SET NULL
-- Isso permite que o setor seja excluído mesmo se houver pedidos relacionados
-- O campo setor_id nos pedidos será definido como NULL quando o setor for excluído
ALTER TABLE public.pedidos
ADD CONSTRAINT pedidos_setor_id_fkey
FOREIGN KEY (setor_id) REFERENCES public.setores_cliente(id)
ON DELETE SET NULL;
