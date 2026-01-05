-- Adicionar campo contato na tabela clientes
-- Este campo permite armazenar o nome do contato principal do cliente

ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS contato TEXT;

-- Adicionar comentário ao campo
COMMENT ON COLUMN public.clientes.contato IS 'Nome do contato principal do cliente';
