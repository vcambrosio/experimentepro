-- Tabela de configuração da empresa
CREATE TABLE IF NOT EXISTS public.configuracao_empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_empresa TEXT NOT NULL,
  logo_url TEXT,
  logo_pdf_url TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  validade_orcamento_dias INTEGER NOT NULL DEFAULT 30,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.configuracao_empresa ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública (configuração única da empresa)
CREATE POLICY "Permitir leitura pública"
  ON public.configuracao_empresa
  FOR SELECT
  TO public
  USING (true);

-- Política para permitir inserção apenas para usuários autenticados
CREATE POLICY "Permitir inserção para autenticados"
  ON public.configuracao_empresa
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para permitir atualização apenas para usuários autenticados
CREATE POLICY "Permitir atualização para autenticados"
  ON public.configuracao_empresa
  FOR UPDATE
  TO authenticated
  USING (true);

-- Criar índice para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_configuracao_empresa_updated_at 
  ON public.configuracao_empresa(updated_at DESC);

-- Inserir configuração padrão
INSERT INTO public.configuracao_empresa (nome_empresa, validade_orcamento_dias)
VALUES ('Minha Empresa', 30)
ON CONFLICT DO NOTHING;
