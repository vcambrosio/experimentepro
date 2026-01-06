# Instruções para Corrigir o Pedido do Dia 05/01/2026 às 18:58

## Problema
O pedido do dia 05/01/2026 às 18:58 está aparecendo na página **Venda Loja** quando deveria aparecer na página **Pedidos**.

## Solução
Execute o script completo que:
1. Cria o campo `tipo_pedido` na tabela `pedidos` (se ainda não existir)
2. Atualiza o pedido específico para `tipo_pedido = 'evento_cesta'`

## Passos para Executar

### 1. Acesse o Supabase Dashboard
- Vá para https://supabase.com/dashboard
- Faça login na sua conta
- Selecione o seu projeto

### 2. Abra o SQL Editor
- No menu lateral, clique em **SQL Editor**
- Clique em **New Query** para criar uma nova query

### 3. Copie e Execute o Script
- Copie todo o conteúdo do arquivo: [`COMPLETO_CORRIGIR_PEDIDO_05_01.sql`](COMPLETO_CORRIGIR_PEDIDO_05_01.sql)
- Cole no SQL Editor
- Clique em **Run** para executar

### 4. Verifique o Resultado
O script mostrará:
- Se o campo `tipo_pedido` foi criado ou se já existia
- O pedido atualizado com `tipo_pedido = 'evento_cesta'`
- Informações do pedido (cliente, setor, orçamento, etc.)

## Após Executar o Script

1. **Atualize a página do sistema** no navegador
2. Vá para a página **Pedidos** e verifique se o pedido aparece lá
3. Vá para a página **Venda Loja** e verifique se o pedido NÃO aparece mais lá

## Se Ainda Não Funcionar

Execute o script de verificação: [`VERIFICAR_CAMPO_TIPO_PEDIDO.sql`](VERIFICAR_CAMPO_TIPO_PEDIDO.sql)

Este script mostrará:
- Se o campo `tipo_pedido` existe na tabela
- Qual é o valor atual do `tipo_pedido` para o pedido
- Quantos pedidos têm cada tipo

Compartilhe o resultado da verificação para que possamos investigar mais.
