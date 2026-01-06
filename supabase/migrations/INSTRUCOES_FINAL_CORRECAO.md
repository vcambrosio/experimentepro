# CORREÇÃO FINAL DO BUG

## Pedido a ser corrigido
**ID**: `97f05edf-1097-40b3-b59b-d69f7d7ae2d3`

## Instruções

### 1️⃣ Execute o SQL de Correção

1. Abra o arquivo [`CORRIGIR_PEDIDO_ESPECIFICO.sql`](CORRIGIR_PEDIDO_ESPECIFICO.sql)
2. Copie todo o conteúdo do arquivo
3. Acesse o **Supabase Dashboard** → **SQL Editor**
4. Cole o SQL e clique em **Run**

Este script irá:
- ✅ Atualizar o pedido `97f05edf-1097-40b3-b59b-d69f7d7ae2d3` para `tipo_pedido = 'evento_cesta'`
- ✅ Mostrar o resultado da atualização

### 2️⃣ Atualize a Página no Navegador

Após executar o SQL:
- Pressione **F5** ou **Ctrl+R** para atualizar a página
- Vá para a página **Pedidos** e verifique se o pedido aparece lá
- Vá para a página **Venda Loja** e verifique se o pedido NÃO aparece mais lá

## ✅ Resultado Esperado

Após a correção:
- **Página Pedidos**: Deve mostrar 11 pedidos (10 + 1 corrigido)
- **Página Venda Loja**: Deve mostrar 1 pedido (2 - 1 corrigido)
- O pedido com ID `97f05edf-1097-40b3-b59b-d69f7d7ae2d3` deve aparecer apenas na página **Pedidos**
