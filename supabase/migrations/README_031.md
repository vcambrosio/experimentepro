# Instruções para Aplicar a Migração 031

## Problema
Pedidos de Evento/Cesta com data de entrega no mesmo dia da criação estavam aparecendo na página VendaLoja em vez da página Pedidos.

## Solução
Adicionamos um campo `tipo_pedido` na tabela `pedidos` para diferenciar claramente entre:
- `venda_loja`: Vendas imediatas na loja
- `evento_cesta`: Pedidos de evento ou cesta com entrega agendada

## Como Aplicar a Migração

### Passo 1: Adicionar o Campo tipo_pedido

1. Acesse o Dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Copie e cole o SQL do arquivo [`031_add_tipo_pedido_to_pedidos.sql`](031_add_tipo_pedido_to_pedidos.sql)
5. Clique em **Run** para executar a migração

### Passo 2: Corrigir Pedidos de 05/01/2026

Execute o SQL do arquivo [`031_corrigir_pedidos_05_01_FINAL.sql`](031_corrigir_pedidos_05_01_FINAL.sql) no SQL Editor do Supabase.

Este script:
1. Define todos os pedidos do dia como "evento_cesta"
2. Atualiza apenas os que são claramente "venda_loja" (sem setor e sem orçamento)

Isso garante que todos os pedidos do dia sejam classificados corretamente.

## Alterações Realizadas no Código

### 1. Tipos TypeScript (`src/types/index.ts`)
- Adicionado tipo `TipoPedido` com valores `'venda_loja' | 'evento_cesta'`
- Adicionado campo `tipo_pedido` (opcional) na interface `Pedido`

### 2. Hook de Pedidos (`src/hooks/usePedidos.ts`)
- Atualizado `useCreatePedido` para garantir valor padrão de `tipo_pedido`

### 3. Formulário de Pedido (`src/components/pedidos/PedidoFormDialog.tsx`)
- Adicionado `tipo_pedido: 'evento_cesta'` ao criar novos pedidos

### 4. Formulário de Venda Loja (`src/components/vendas-loja/VendaLojaFormDialog.tsx`)
- Adicionado `tipo_pedido: 'venda_loja'` ao criar novas vendas

### 5. Página Venda Loja (`src/pages/VendaLoja.tsx`)
- Alterado filtro para usar `pedido.tipo_pedido === 'venda_loja'` em vez de comparar datas
- Fallback: Se `tipo_pedido` não existir, considera como Venda Loja se NÃO tiver `setor_id` E NÃO tiver `orcamento_id`

### 6. Página Pedidos (`src/pages/Pedidos.tsx`)
- Alterado filtro para usar `pedido.tipo_pedido === 'evento_cesta'` em vez de comparar datas
- Fallback: Se `tipo_pedido` não existir, considera como Evento/Cesta se tiver `setor_id` definido OU se tiver `orcamento_id` definido

### 7. Hook de Orçamentos (`src/hooks/useOrcamentos.ts`)
- Atualizado `useConvertOrcamentoToPedido` para incluir `tipo_pedido: 'evento_cesta'`

## Compatibilidade com Pedidos Antigos

O código foi atualizado para lidar com pedidos que ainda não têm o campo `tipo_pedido` definido (pedidos criados antes da migração):

- **Página Pedidos**: Se `tipo_pedido` não existir, considera como Evento/Cesta se tiver `setor_id` definido OU se tiver `orcamento_id` definido
- **Página Venda Loja**: Se `tipo_pedido` não existir, considera como Venda Loja se NÃO tiver `setor_id` E NÃO tiver `orcamento_id` definido

Essa lógica baseia-se no fato de que pedidos de Evento/Cesta sempre têm um setor definido ou são criados a partir de orçamentos, enquanto vendas de loja geralmente não têm setor nem orçamento.

## Teste

Após aplicar a migração:

1. Crie um novo Pedido de Evento ou Cesta com data de entrega no mesmo dia
2. Verifique se ele aparece na página **Pedidos** (não na Venda Loja)
3. Crie uma nova Venda de Loja
4. Verifique se ela aparece na página **Venda Loja** (não na Pedidos)

Após aplicar a migração e atualizar os pedidos antigos, os novos pedidos de Evento/Cesta aparecerão corretamente na página Pedidos, independentemente da data de entrega escolhida.
