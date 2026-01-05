-- Migration para finalizar a criação das tabelas financeiras
-- Esta migration só cria o que ainda não existe

-- Criar tabelas se não existirem
CREATE TABLE IF NOT EXISTS categorias_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  cor VARCHAR(7) DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lancamentos_financeiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  categoria_id UUID NOT NULL REFERENCES categorias_financeiras(id) ON DELETE RESTRICT,
  descricao TEXT NOT NULL,
  valor NUMERIC(15, 2) NOT NULL,
  data_lancamento DATE NOT NULL,
  data_pagamento DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'realizado', 'cancelado')),
  forma_pagamento VARCHAR(50),
  observacoes TEXT,
  pedido_id UUID REFERENCES pedidos(id) ON DELETE SET NULL,
  recorrente BOOLEAN DEFAULT false,
  recorrencia_periodo VARCHAR(20) CHECK (recorrencia_periodo IN ('mensal', 'trimestral', 'semestral', 'anual')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_lancamentos_financeiros_tipo ON lancamentos_financeiros(tipo);
CREATE INDEX IF NOT EXISTS idx_lancamentos_financeiros_categoria ON lancamentos_financeiros(categoria_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_financeiros_data ON lancamentos_financeiros(data_lancamento);
CREATE INDEX IF NOT EXISTS idx_lancamentos_financeiros_status ON lancamentos_financeiros(status);
CREATE INDEX IF NOT EXISTS idx_lancamentos_financeiros_pedido ON lancamentos_financeiros(pedido_id);

-- Criar função de trigger se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers se não existirem
DROP TRIGGER IF EXISTS update_categorias_financeiras_updated_at ON categorias_financeiras;
CREATE TRIGGER update_categorias_financeiras_updated_at
  BEFORE UPDATE ON categorias_financeiras
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lancamentos_financeiros_updated_at ON lancamentos_financeiros;
CREATE TRIGGER update_lancamentos_financeiros_updated_at
  BEFORE UPDATE ON lancamentos_financeiros
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS se não estiver habilitado
ALTER TABLE categorias_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE lancamentos_financeiros ENABLE ROW LEVEL SECURITY;

-- Criar políticas se não existirem
DROP POLICY IF EXISTS "Todos podem ver categorias ativas" ON categorias_financeiras;
CREATE POLICY "Todos podem ver categorias ativas"
  ON categorias_financeiras FOR SELECT
  USING (ativo = true);

DROP POLICY IF EXISTS "Apenas admin pode inserir categorias" ON categorias_financeiras;
CREATE POLICY "Apenas admin pode inserir categorias"
  ON categorias_financeiras FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Apenas admin pode atualizar categorias" ON categorias_financeiras;
CREATE POLICY "Apenas admin pode atualizar categorias"
  ON categorias_financeiras FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Apenas admin pode deletar categorias" ON categorias_financeiras;
CREATE POLICY "Apenas admin pode deletar categorias"
  ON categorias_financeiras FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Todos podem ver lançamentos" ON lancamentos_financeiros;
CREATE POLICY "Todos podem ver lançamentos"
  ON lancamentos_financeiros FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Apenas admin pode inserir lançamentos" ON lancamentos_financeiros;
CREATE POLICY "Apenas admin pode inserir lançamentos"
  ON lancamentos_financeiros FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Apenas admin pode atualizar lançamentos" ON lancamentos_financeiros;
CREATE POLICY "Apenas admin pode atualizar lançamentos"
  ON lancamentos_financeiros FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Apenas admin pode deletar lançamentos" ON lancamentos_financeiros;
CREATE POLICY "Apenas admin pode deletar lançamentos"
  ON lancamentos_financeiros FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Inserir categorias financeiras padrão (só se não existirem)
INSERT INTO categorias_financeiras (nome, tipo, descricao, cor)
SELECT * FROM (VALUES
  -- Receitas
  ('Vendas de Produtos', 'receita', 'Receitas provenientes de vendas de produtos', '#22c55e'),
  ('Serviços Prestados', 'receita', 'Receitas de serviços prestados', '#22c55e'),
  ('Outras Receitas', 'receita', 'Receitas de outras fontes', '#22c55e'),
  ('Juros Recebidos', 'receita', 'Receitas de juros e rendimentos', '#22c55e'),
  -- Despesas
  ('Fornecedores', 'despesa', 'Pagamentos a fornecedores de materiais', '#ef4444'),
  ('Funcionários', 'despesa', 'Salários e benefícios de funcionários', '#ef4444'),
  ('Aluguel', 'despesa', 'Pagamento de aluguel do imóvel', '#ef4444'),
  ('Energia e Água', 'despesa', 'Contas de energia elétrica e água', '#ef4444'),
  ('Internet e Telefone', 'despesa', 'Serviços de internet e telefone', '#ef4444'),
  ('Transporte', 'despesa', 'Despesas com transporte e combustível', '#ef4444'),
  ('Marketing', 'despesa', 'Investimentos em marketing e publicidade', '#ef4444'),
  ('Impostos', 'despesa', 'Pagamento de impostos e taxas', '#ef4444'),
  ('Manutenção', 'despesa', 'Manutenção de equipamentos e instalações', '#ef4444'),
  ('Outras Despesas', 'despesa', 'Despesas não categorizadas', '#ef4444')
) AS v(nome, tipo, descricao, cor)
WHERE NOT EXISTS (
  SELECT 1 FROM categorias_financeiras 
  WHERE categorias_financeiras.nome = v.nome
);
