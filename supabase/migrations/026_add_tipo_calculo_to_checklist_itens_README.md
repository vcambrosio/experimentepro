# Migration 026: Adicionar campo tipo_calculo à tabela checklist_itens

## Descrição
Esta migration adiciona o campo `tipo_calculo` à tabela `checklist_itens` para permitir dois tipos de cálculo de quantidade nos itens de checklist:

- **`unitario`**: Quantidade fixa que não é multiplicada pela quantidade do produto no pedido
- **`multiplo`**: Quantidade que é multiplicada pela quantidade do produto no pedido (comportamento padrão)

## Exemplo de Uso

### Tipo Múltiplo (padrão)
- Pedido: 10 unidades de "Coffee Break"
- Item de checklist: 2x "Café" (tipo: múltiplo)
- **Resultado no pedido**: 20 cafés (2 × 10)

### Tipo Unitário
- Pedido: 10 unidades de "Coffee Break"
- Item de checklist: 2x "Mesa" (tipo: unitário)
- **Resultado no pedido**: 2 mesas (quantidade fixa, não multiplica)

## Como Executar

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (ícone de terminal no menu lateral)
4. Crie uma nova query
5. Copie e execute o SQL abaixo:

```sql
-- Adicionar campo tipo_calculo à tabela checklist_itens
ALTER TABLE public.checklist_itens
ADD COLUMN IF NOT EXISTS tipo_calculo TEXT NOT NULL DEFAULT 'multiplo'
CHECK (tipo_calculo IN ('unitario', 'multiplo'));

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.checklist_itens.tipo_calculo IS 'Define como a quantidade é calculada: "unitario" (fixa) ou "multiplo" (multiplicada pela quantidade do produto no pedido)';
```

### Opção 2: Via Supabase CLI

Se você tiver o Supabase CLI instalado:

```bash
supabase db push
```

Ou execute a migration específica:

```bash
supabase migration up 026_add_tipo_calculo_to_checklist_itens.sql
```

## Alterações no Código

Esta migration está integrada com as seguintes alterações no código:

1. **Types** ([`src/types/index.ts`](src/types/index.ts:1))
   - Adicionado tipo `TipoCalculoChecklist` com valores `'unitario' | 'multiplo'`
   - Atualizada interface `ChecklistItem` com campo `tipo_calculo`

2. **ProdutoForm** ([`src/pages/ProdutoForm.tsx`](src/pages/ProdutoForm.tsx:1))
   - Adicionado seletor para escolher o tipo de cálculo ao criar/editar itens de checklist
   - Exibição de texto explicativo sobre o comportamento de cada tipo

3. **PedidoChecklist** ([`src/components/pedidos/PedidoChecklist.tsx`](src/components/pedidos/PedidoChecklist.tsx:1))
   - Atualizada lógica de cálculo de quantidade total baseada no `tipo_calculo`
   - Itens do tipo `multiplo` multiplicam pela quantidade do pedido
   - Itens do tipo `unitario` mantêm quantidade fixa

## Verificação

Após executar a migration, verifique se o campo foi adicionado corretamente:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'checklist_itens' 
  AND column_name = 'tipo_calculo';
```

O resultado deve mostrar:
- `column_name`: `tipo_calculo`
- `data_type`: `text`
- `column_default`: `'multiplo'::text`

## Rollback (Reverter)

Se necessário reverter esta migration:

```sql
ALTER TABLE public.checklist_itens DROP COLUMN IF EXISTS tipo_calculo;
```

## Notas Importantes

- O valor padrão é `'multiplo'`, mantendo compatibilidade com itens existentes
- Itens criados antes desta migration terão comportamento de múltiplo (compatível)
- A interface do usuário mostra claramente o tipo selecionado e seu comportamento
- O PDF do checklist também reflete corretamente as quantidades calculadas
