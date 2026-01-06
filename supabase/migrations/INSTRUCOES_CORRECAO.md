# CORREÇÃO DO BUG: Pedido Aparece em Venda Loja em Vez de Pedidos

## Problema
O pedido do dia 05/01/2026 às 18:58 está aparecendo na página **Venda Loja** quando deveria aparecer na página **Pedidos**.

## Causa
O sistema não tem o campo `tipo_pedido` para diferenciar claramente entre:
- **Venda Loja**: vendas imediatas na loja
- **Pedido de Evento/Cesta**: pedidos com entrega agendada

## Solução

### Passo 1: Execute o SQL no Supabase

1. Abra o arquivo [`COMPLETO_CORRIGIR_PEDIDO_05_01.sql`](COMPLETO_CORRIGIR_PEDIDO_05_01.sql)
2. Copie todo o conteúdo do arquivo
3. Acesse o **Supabase Dashboard** → **SQL Editor**
4. Cole o SQL e clique em **Run**

Este script irá:
- ✅ Criar o campo `tipo_pedido` na tabela `pedidos` (se não existir)
- ✅ Atualizar o pedido do dia 05/01/2026 às 18:58 para `tipo_pedido = 'evento_cesta'`
- ✅ Mostrar o resultado da atualização

### Passo 2: Atualize a Página no Navegador

Após executar o SQL:
1. **Atualize a página** no navegador (pressione **F5** ou **Ctrl+R**)
2. Vá para a página **Pedidos** e verifique se o pedido aparece lá
3. Vá para a página **Venda Loja** e verifique se o pedido NÃO aparece mais lá

## Se Ainda Não Funcionar

Execute o script de verificação: [`VERIFICAR_CAMPO_TIPO_PEDIDO.sql`](VERIFICAR_CAMPO_TIPO_PEDIDO.sql)

Este script mostrará:
- Se o campo `tipo_pedido` existe na tabela
- Qual é o valor atual do `tipo_pedido` para o pedido
- Quantos pedidos têm cada tipo

Compartilhe o resultado da verificação para que possamos investigar mais.

## Arquivos Modificados no Código

Os seguintes arquivos foram atualizados para usar o campo `tipo_pedido`:

- [`src/types/index.ts`](src/types/index.ts) - Adicionado tipo `TipoPedido`
- [`src/hooks/usePedidos.ts`](src/hooks/usePedidos.ts) - Garantido valor padrão `'evento_cesta'`
- [`src/components/pedidos/PedidoFormDialog.tsx`](src/components/pedidos/PedidoFormDialog.tsx) - Define `tipo_pedido: 'evento_cesta'`
- [`src/components/vendas-loja/VendaLojaFormDialog.tsx`](src/components/vendas-loja/VendaLojaFormDialog.tsx) - Define `tipo_pedido: 'venda_loja'`
- [`src/pages/Pedidos.tsx`](src/pages/Pedidos.tsx) - Filtra por `tipo_pedido === 'evento_cesta'` com fallback
- [`src/pages/VendaLoja.tsx`](src/pages/VendaLoja.tsx) - Filtra por `tipo_pedido === 'venda_loja'` com fallback
- [`src/hooks/useOrcamentos.ts`](src/hooks/useOrcamentos.ts) - Define `tipo_pedido: 'evento_cesta'` ao converter orçamento em pedido

## Como o Sistema Funciona Agora

### Novos Pedidos
- **PedidoFormDialog**: Cria pedidos com `tipo_pedido = 'evento_cesta'` → aparecem na página **Pedidos**
- **VendaLojaFormDialog**: Cria pedidos com `tipo_pedido = 'venda_loja'` → aparecem na página **Venda Loja**
- **Orcamentos**: Ao converter orçamento em pedido, define `tipo_pedido = 'evento_cesta'` → aparecem na página **Pedidos**

### Pedidos Antigos (Fallback)
Para pedidos criados antes da migração (sem `tipo_pedido`), o sistema usa:
- **Venda Loja page**: Mostra pedidos onde `!setor_id && !orcamento_id`
- **Pedidos page**: Mostra pedidos onde `!!setor_id || !!orcamento_id`

Isso garante que pedidos antigos continuem funcionando corretamente.
