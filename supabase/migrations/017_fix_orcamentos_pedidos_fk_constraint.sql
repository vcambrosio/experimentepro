-- Corrigir a restrição de chave estrangeira na tabela pedidos para orcamento_id
-- Permite excluir orçamentos mesmo quando há pedidos relacionados

-- Primeiro, verificar se a constraint existe
DO $$
BEGIN
    -- Remover a constraint antiga se existir
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_schema='public' 
        AND table_name='pedidos' 
        AND constraint_name='pedidos_orcamento_id_fkey'
    ) THEN
        ALTER TABLE public.pedidos DROP CONSTRAINT pedidos_orcamento_id_fkey;
    END IF;
END $$;

-- Criar nova constraint com ON DELETE SET NULL
-- Isso permite que o orçamento seja excluído mesmo se houver pedidos relacionados
-- O campo orcamento_id nos pedidos será definido como NULL quando o orçamento for excluído
ALTER TABLE public.pedidos
ADD CONSTRAINT pedidos_orcamento_id_fkey
FOREIGN KEY (orcamento_id) REFERENCES public.orcamentos(id)
ON DELETE SET NULL;
