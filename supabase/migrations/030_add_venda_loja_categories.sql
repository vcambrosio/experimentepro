-- Adicionar categorias especiais para Venda Loja e Evento/Cesta
-- Estas categorias não podem ser excluídas

-- Adicionar coluna para marcar categorias que não podem ser excluídas
ALTER TABLE categorias_financeiras ADD COLUMN IF NOT EXISTS exclusao_bloqueada BOOLEAN DEFAULT false;

-- Atualizar a categoria "Vendas de Produtos" para não permitir exclusão
UPDATE categorias_financeiras 
SET exclusao_bloqueada = true
WHERE nome = 'Vendas de Produtos';

-- Inserir nova categoria para Venda Loja
INSERT INTO categorias_financeiras (nome, tipo, descricao, cor, ativo, exclusao_bloqueada)
VALUES (
  'Receita Venda Loja',
  'receita',
  'Receitas provenientes de vendas de loja',
  '#22c55e',
  true,
  true
) ON CONFLICT DO NOTHING;

-- Inserir nova categoria para Evento ou Cesta
INSERT INTO categorias_financeiras (nome, tipo, descricao, cor, ativo, exclusao_bloqueada)
VALUES (
  'Receita Evento ou Cesta',
  'receita',
  'Receitas provenientes de pedidos de evento ou cesta',
  '#22c55e',
  true,
  true
) ON CONFLICT DO NOTHING;
