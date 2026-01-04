# PRD - Experimente Pro
## Sistema de Gestão de Agendamento e Vendas

---

## 1. Visão Geral do Produto

### 1.1 Objetivo
Desenvolver um sistema web completo para gestão de agendamento, vendas e controle operacional de produtos e serviços alimentícios, com foco em coffee breaks, bolos, produtos congelados e cestas de café da manhã.

### 1.2 Tecnologias
- **Frontend**: React (via Lovable)
- **Backend/Database**: Supabase (conta existente do cliente)
- **Hospedagem**: VPS
- **Autenticação**: Supabase Auth

### 1.3 Usuários-Alvo
- Administradores (acesso total + financeiro)
- Usuários operacionais (sem visualização de valores)

---

## 2. Design System e Identidade Visual

### 2.1 Paleta de Cores

**Cores Primárias (tons que remetem a alimentos):**
- **Laranja Suave**: `#FF8C42` - Cor principal (evoca calor, energia, alimentos frescos)
- **Laranja Claro**: `#FFB380` - Variação mais clara para hover e destaques
- **Bege Quente**: `#F5E6D3` - Backgrounds e áreas secundárias

**Cores Secundárias:**
- **Verde Menta**: `#A8D5BA` - Sucesso, pedidos executados (fresco, natural)
- **Amarelo Manteiga**: `#FFE5B4` - Avisos, pedidos pendentes (suave, acolhedor)
- **Coral Suave**: `#FFB3BA` - Alertas leves, cancelamentos
- **Azul Céu**: `#AED9E0` - Informações, pagamentos confirmados

**Cores Neutras:**
- **Branco**: `#FFFFFF` - Background principal
- **Cinza Claro**: `#F8F9FA` - Background alternativo
- **Cinza Médio**: `#E9ECEF` - Bordas e divisores
- **Cinza Texto**: `#495057` - Texto principal (nunca preto puro)
- **Cinza Secundário**: `#6C757D` - Texto secundário

**Cores de Status:**
- **Pendente**: `#FFE5B4` (Amarelo Manteiga)
- **Executado**: `#A8D5BA` (Verde Menta)
- **Pago**: `#AED9E0` (Azul Céu)
- **Cancelado**: `#FFB3BA` (Coral Suave)
- **Orçamento Aprovado**: `#B8E6B8` (Verde Claro)

**❌ Cores a EVITAR:**
- Roxo, violeta, lilás (todas as variações)
- Preto puro (`#000000`)
- Cores escuras/saturadas
- Tons frios muito intensos

### 2.2 Tipografia

**Fontes Recomendadas (Clean e Legíveis):**

**Opção 1 - Sans Serif Moderna:**
- **Primary**: Inter ou Poppins
  - Títulos: 600 (Semi-bold)
  - Subtítulos: 500 (Medium)
  - Corpo: 400 (Regular)
  - Pequenos: 300 (Light)

**Opção 2 - Sans Serif Humanista:**
- **Primary**: Open Sans ou Nunito
  - Títulos: 700 (Bold)
  - Subtítulos: 600 (Semi-bold)
  - Corpo: 400 (Regular)
  - Pequenos: 300 (Light)

**Hierarquia de Texto:**
```css
/* Títulos Principais */
h1: {
  font-size: 2rem (32px)
  font-weight: 600
  color: #495057
  letter-spacing: -0.02em
}

/* Títulos de Seção */
h2: {
  font-size: 1.5rem (24px)
  font-weight: 600
  color: #495057
  letter-spacing: -0.01em
}

/* Subtítulos */
h3: {
  font-size: 1.25rem (20px)
  font-weight: 500
  color: #6C757D
}

/* Corpo de Texto */
body: {
  font-size: 1rem (16px)
  font-weight: 400
  color: #495057
  line-height: 1.6
}

/* Texto Secundário */
small: {
  font-size: 0.875rem (14px)
  font-weight: 400
  color: #6C757D
}

/* Labels */
label: {
  font-size: 0.875rem (14px)
  font-weight: 500
  color: #495057
  text-transform: uppercase
  letter-spacing: 0.05em
}
```

### 2.3 Componentes de Interface

**Botões:**
```css
/* Botão Primário */
.btn-primary {
  background: #FF8C42
  color: #FFFFFF
  border: none
  border-radius: 8px
  padding: 12px 24px
  font-weight: 500
  box-shadow: 0 2px 4px rgba(255, 140, 66, 0.2)
  transition: all 0.3s ease
}

.btn-primary:hover {
  background: #FFB380
  transform: translateY(-2px)
  box-shadow: 0 4px 8px rgba(255, 140, 66, 0.3)
}

/* Botão Secundário */
.btn-secondary {
  background: #FFFFFF
  color: #FF8C42
  border: 2px solid #FF8C42
  border-radius: 8px
  padding: 12px 24px
  font-weight: 500
}

/* Botão Sucesso */
.btn-success {
  background: #A8D5BA
  color: #495057
}

/* Botão Cancelar */
.btn-cancel {
  background: #F8F9FA
  color: #6C757D
  border: 1px solid #E9ECEF
}
```

**Cards:**
```css
.card {
  background: #FFFFFF
  border: 1px solid #E9ECEF
  border-radius: 12px
  padding: 24px
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05)
  transition: all 0.3s ease
}

.card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08)
  transform: translateY(-2px)
}
```

**Inputs:**
```css
.input {
  background: #FFFFFF
  border: 1.5px solid #E9ECEF
  border-radius: 8px
  padding: 12px 16px
  font-size: 1rem
  color: #495057
  transition: all 0.3s ease
}

.input:focus {
  border-color: #FF8C42
  outline: none
  box-shadow: 0 0 0 3px rgba(255, 140, 66, 0.1)
}
```

### 2.4 Gráficos e Visualizações

**Estilo Clean para Gráficos:**

**Biblioteca Recomendada**: Recharts ou Chart.js com configurações customizadas

**Configurações Gerais:**
```javascript
const chartConfig = {
  // Cores para séries de dados
  colors: ['#FF8C42', '#A8D5BA', '#AED9E0', '#FFE5B4', '#FFB3BA'],
  
  // Grid
  grid: {
    stroke: '#E9ECEF',
    strokeWidth: 1,
    strokeDasharray: '3 3'
  },
  
  // Eixos
  axis: {
    stroke: '#6C757D',
    fontSize: 12,
    fontWeight: 400,
    fontFamily: 'Inter'
  },
  
  // Tooltips
  tooltip: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E9ECEF',
    borderRadius: 8,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    fontSize: 14,
    padding: 12
  },
  
  // Barras/Linhas
  bar: {
    radius: [8, 8, 0, 0], // Cantos arredondados no topo
    opacity: 0.9
  },
  
  line: {
    strokeWidth: 3,
    dot: {
      r: 5,
      fill: '#FFFFFF',
      strokeWidth: 2
    }
  }
}
```

**Exemplo de Gráfico de Linha (Clean):**
```javascript
<LineChart data={data}>
  <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" />
  <XAxis 
    dataKey="name" 
    stroke="#6C757D" 
    style={{ fontSize: 12, fontFamily: 'Inter' }}
  />
  <YAxis 
    stroke="#6C757D" 
    style={{ fontSize: 12, fontFamily: 'Inter' }}
  />
  <Tooltip 
    contentStyle={{
      backgroundColor: '#FFFFFF',
      border: '1px solid #E9ECEF',
      borderRadius: 8,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
    }}
  />
  <Line 
    type="monotone" 
    dataKey="vendas" 
    stroke="#FF8C42" 
    strokeWidth={3}
    dot={{ r: 5, fill: '#FFFFFF', strokeWidth: 2 }}
  />
</LineChart>
```

### 2.5 Layout e Espaçamento

**Sistema de Espaçamento:**
```css
/* Base: 8px */
--space-xs: 4px
--space-sm: 8px
--space-md: 16px
--space-lg: 24px
--space-xl: 32px
--space-2xl: 48px
--space-3xl: 64px
```

**Containers:**
```css
.container {
  max-width: 1280px
  margin: 0 auto
  padding: 0 24px
}

.page-header {
  padding: 32px 0
  border-bottom: 1px solid #E9ECEF
  background: linear-gradient(to bottom, #FFFFFF, #F8F9FA)
}
```

**Sidebar/Menu:**
```css
.sidebar {
  background: #FFFFFF
  border-right: 1px solid #E9ECEF
  width: 260px
  padding: 24px 16px
}

.menu-item {
  padding: 12px 16px
  border-radius: 8px
  color: #6C757D
  transition: all 0.2s ease
}

.menu-item:hover {
  background: #F5E6D3
  color: #FF8C42
}

.menu-item.active {
  background: #FFB380
  color: #FFFFFF
}
```

### 2.6 Ícones

**Biblioteca Recomendada**: Lucide Icons ou Heroicons

**Estilo:**
- Stroke weight: 2px (clean e leve)
- Tamanho padrão: 20px
- Cor padrão: `#6C757D`
- Cor ativa: `#FF8C42`

### 2.7 Animações e Transições

**Princípios:**
- Suaves e discretas
- Duração: 200-300ms
- Easing: ease-in-out

```css
/* Transição padrão */
.element {
  transition: all 0.3s ease-in-out
}

/* Hover elevação */
.card:hover {
  transform: translateY(-2px)
}

/* Loading suave */
@keyframes pulse {
  0%, 100% { opacity: 1 }
  50% { opacity: 0.5 }
}

.loading {
  animation: pulse 2s ease-in-out infinite
}
```

### 2.8 Responsividade

**Breakpoints:**
```css
/* Mobile */
@media (max-width: 640px) { ... }

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) { ... }

/* Desktop */
@media (min-width: 1025px) { ... }
```

**Mobile-First**: Design otimizado primeiro para mobile, expandindo para desktop

### 2.9 Estados Visuais

**Estado Hover:**
- Elevação sutil (+2px)
- Mudança de cor suave
- Sombra mais pronunciada

**Estado Focus:**
- Borda destacada com cor primária
- Box-shadow suave
- Sem outline padrão do navegador

**Estado Disabled:**
- Opacidade: 0.5
- Cursor: not-allowed
- Cores dessaturadas

**Estado Loading:**
- Skeleton screens com fundo `#F8F9FA`
- Animação de pulse suave
- Sem spinners escuros

### 2.10 Acessibilidade

**Contraste:**
- Textos principais: Mínimo 4.5:1
- Textos grandes: Mínimo 3:1
- Elementos interativos: Claramente distinguíveis

**Foco Visível:**
- Sempre presente para navegação por teclado
- Cor: `#FF8C42`
- Outline: 2px solid

---

## 3. Funcionalidades Principais

### 3.1 Sistema de Autenticação

**Design da Tela de Login:**
```css
.login-container {
  background: linear-gradient(135deg, #FFB380 0%, #F5E6D3 100%)
  min-height: 100vh
  display: flex
  align-items: center
  justify-content: center
}

.login-card {
  background: #FFFFFF
  border-radius: 16px
  padding: 48px
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1)
  max-width: 420px
}

.logo-container {
  text-align: center
  margin-bottom: 32px
}
```

**Requisitos:**
- Login via Supabase Auth
- Dois níveis de permissão:
  - **Admin**: Acesso completo incluindo valores financeiros
  - **Usuário Simples**: Cadastro e gestão de pedidos sem visualização de valores
- Gerenciamento de sessão segura

**Estrutura de Dados:**
```sql
Table: users
- id (UUID, PK)
- email (TEXT)
- role (ENUM: 'admin', 'user')
- created_at (TIMESTAMP)
```

---

### 3.2 Cadastro de Clientes (CRUD Completo)

**Campos Obrigatórios:**
- Nome (pessoa física ou jurídica)
- Tipo (física/jurídica)

**Campos Opcionais:**
- CPF ou CNPJ
- Endereço completo
- Telefone
- Email
- Emite nota fiscal (sim/não)

**Campos Condicionais - Pessoa Jurídica (TODOS OPCIONAIS):**
- Setor(es)
- Nome do responsável pelo setor
- Possibilidade de múltiplos setores por empresa

**Operações CRUD:**
- ✓ **Create**: Criar novo cliente
- ✓ **Read**: Listar e visualizar clientes
- ✓ **Update**: Editar informações do cliente
- ✓ **Delete**: Excluir cliente (com validação de pedidos/orçamentos vinculados)

**Estrutura de Dados:**
```sql
Table: clientes
- id (UUID, PK)
- nome (TEXT, NOT NULL)
- tipo_pessoa (ENUM: 'fisica', 'juridica', NOT NULL)
- cpf_cnpj (TEXT, NULL)
- endereco (TEXT, NULL)
- telefone (TEXT, NULL)
- email (TEXT, NULL)
- emite_nota_fiscal (BOOLEAN, DEFAULT false)
- ativo (BOOLEAN, DEFAULT true)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Table: setores_cliente
- id (UUID, PK)
- cliente_id (UUID, FK)
- nome_setor (TEXT, NULL)
- responsavel (TEXT, NULL)
- created_at (TIMESTAMP)
```

**Validações:**
- Impedir exclusão de cliente com pedidos ou orçamentos ativos
- Opção de inativar cliente ao invés de excluir

---

### 3.3 Cadastro de Categorias (CRUD Completo)

**Categorias Iniciais:**
1. Coffee Break
2. Bolos
3. Produtos Congelados
4. Cestas de Café da Manhã

**Operações CRUD:**
- ✓ **Create**: Criar nova categoria
- ✓ **Read**: Listar categorias
- ✓ **Update**: Editar nome da categoria
- ✓ **Delete**: Excluir categoria (com validação de produtos vinculados)

**Estrutura de Dados:**
```sql
Table: categorias
- id (UUID, PK)
- nome (TEXT, NOT NULL)
- ativo (BOOLEAN, DEFAULT true)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Validações:**
- Nome único para categoria
- Impedir exclusão de categoria com produtos vinculados
- Opção de inativar categoria

---

### 3.4 Cadastro de Produtos e Serviços (CRUD Completo)

**Campos:**
- Categoria (seleção com CRUD próprio)
- Nome do produto/serviço
- Descrição detalhada (modelo inicial editável)
- Valor de venda (visível apenas para admin)
- Status (ativo/inativo)
- Itens do checklist (para categoria Coffee Break)

**Importante - Descrição Editável:**
- Descrição cadastrada serve como **template inicial**
- No momento do pedido/orçamento, usuário pode:
  - Excluir completamente o texto
  - Inserir descrição totalmente personalizada
  - Editar livremente o conteúdo
- Descrição original do produto permanece inalterada no cadastro

**Estrutura de Dados:**
```sql
Table: produtos
- id (UUID, PK)
- categoria_id (UUID, FK)
- nome (TEXT, NOT NULL)
- descricao_padrao (TEXT, NULL)
- valor_venda (DECIMAL, NOT NULL)
- ativo (BOOLEAN, DEFAULT true)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Table: checklist_itens
- id (UUID, PK)
- produto_id (UUID, FK)
- item (TEXT, NOT NULL)
- ordem (INTEGER)
- created_at (TIMESTAMP)
```

---

### 3.5 Criação de Orçamentos

**Objetivo:**
Gerar propostas comerciais para clientes antes da confirmação do pedido.

**Campos do Orçamento:**
- Número do orçamento (gerado automaticamente ou manual)
- Data do orçamento
- Cliente (seleção do cadastro)
- Setor (se pessoa jurídica)
- Itens do orçamento
- Condições comerciais (campo texto livre)
- Valor final da proposta
- Status (pendente/aprovado/recusado/expirado)
- Validade do orçamento

**Itens do Orçamento:**
- Categoria
- Produto/Serviço
- Descrição (editável - pode ser totalmente personalizada)
- Quantidade
- Valor unitário (editável no momento do orçamento)
- Valor total
- Observações

**Funcionalidades:**
- Converter orçamento aprovado em pedido
- Imprimir/exportar orçamento em PDF
- Enviar orçamento por email (implementação futura)
- Duplicar orçamento
- Histórico de orçamentos por cliente

**Estrutura de Dados:**
```sql
Table: orcamentos
- id (UUID, PK)
- numero_orcamento (TEXT, UNIQUE, NOT NULL)
- data_orcamento (DATE, NOT NULL)
- cliente_id (UUID, FK, NOT NULL)
- setor_id (UUID, FK, NULL)
- condicoes_comerciais (TEXT, NULL)
- valor_total (DECIMAL, NOT NULL)
- status (ENUM: 'pendente', 'aprovado', 'recusado', 'expirado')
- validade (DATE, NULL)
- created_at (TIMESTAMP)
- created_by (UUID, FK)
- updated_at (TIMESTAMP)

Table: itens_orcamento
- id (UUID, PK)
- orcamento_id (UUID, FK)
- produto_id (UUID, FK)
- categoria_id (UUID, FK)
- descricao_customizada (TEXT, NULL)
- quantidade (INTEGER, NOT NULL)
- valor_unitario (DECIMAL, NOT NULL)
- valor_total (DECIMAL, NOT NULL)
- observacoes (TEXT, NULL)
- created_at (TIMESTAMP)
```

**Layout de Impressão do Orçamento:**
```
========================================
     EXPERIMENTE PRO
     [LOGOMARCA]
========================================

ORÇAMENTO Nº: [NUMERO]
Data: DD/MM/YYYY
Validade: DD/MM/YYYY

----------------------------------------
Cliente: [NOME DO CLIENTE]
Setor: [NOME DO SETOR]
----------------------------------------

ITENS ORÇADOS:

Qtd  Descrição                 Vlr Unit  Vlr Total
---- ------------------------ ---------- ----------
XX   [PRODUTO/SERVIÇO 1]       R$ XXX,XX R$ XXX,XX
     [Descrição customizada]

XX   [PRODUTO/SERVIÇO 2]       R$ XXX,XX R$ XXX,XX
     [Descrição customizada]

----------------------------------------
                    VALOR TOTAL: R$ XXX,XX
========================================

CONDIÇÕES COMERCIAIS:
[Texto livre das condições comerciais]

========================================
```

---

### 3.6 Cadastro de Pedidos

**Informações do Pedido:**
- Data e hora da entrega/evento
- Cliente (seleção)
- Setor (se pessoa jurídica)
- Status (pendente/executado/cancelado)
- Status de pagamento (pendente/pago)
- Origem (manual/convertido de orçamento)

**Itens do Pedido:**
- Categoria
- Produto/Serviço
- Descrição (editável - pode ser totalmente personalizada)
- Quantidade
- Valor unitário (editável - apenas admin visualiza)
- Valor total (apenas admin visualiza)
- Detalhes adicionais

**Estrutura de Dados:**
```sql
Table: pedidos
- id (UUID, PK)
- cliente_id (UUID, FK)
- setor_id (UUID, FK, NULL)
- orcamento_id (UUID, FK, NULL)
- data_hora_entrega (TIMESTAMP)
- status (ENUM: 'pendente', 'executado', 'cancelado')
- status_pagamento (ENUM: 'pendente', 'pago')
- valor_total (DECIMAL)
- created_at (TIMESTAMP)
- created_by (UUID, FK)
- executed_at (TIMESTAMP, NULL)
- paid_at (TIMESTAMP, NULL)
- updated_at (TIMESTAMP)

Table: itens_pedido
- id (UUID, PK)
- pedido_id (UUID, FK)
- produto_id (UUID, FK)
- categoria_id (UUID, FK)
- descricao_customizada (TEXT, NULL)
- quantidade (INTEGER, NOT NULL)
- valor_unitario (DECIMAL, NOT NULL)
- valor_total (DECIMAL, NOT NULL)
- detalhes (TEXT, NULL)
- created_at (TIMESTAMP)
```

---

### 3.7 Visualização em Calendário

**Design do Calendário:**
```css
.calendar-container {
  background: #FFFFFF
  border-radius: 12px
  padding: 24px
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05)
}

.calendar-event {
  border-radius: 6px
  padding: 4px 8px
  font-size: 12px
  font-weight: 500
  border-left: 3px solid
}

.event-pendente {
  background: #FFE5B4
  border-left-color: #FFB366
  color: #8B6914
}

.event-executado {
  background: #A8D5BA
  border-left-color: #6FB88A
  color: #2D5F3F
}

.event-pago {
  background: #AED9E0
  border-left-color: #5BA9B8
  color: #1A5A66
}
```

**Requisitos:**
- Interface estilo Google Calendar
- Visualização mensal/semanal/diária
- Cores diferentes para status (seguindo paleta definida)
- Clique no evento abre detalhes do pedido
- Possibilidade de arrastar para reagendar

**Funcionalidades:**
- Filtro por status
- Filtro por cliente
- Filtro por categoria
- Busca por data
- Visualizar orçamentos aprovados aguardando conversão

---

### 3.8 Impressão de Pedido (Impressora Térmica 80mm)

**Layout do Recibo:**
```
========================================
     EXPERIMENTE PRO
     [LOGOMARCA]
========================================

Data/Hora: DD/MM/YYYY - HH:MM
Pedido Nº: #XXXX

----------------------------------------
Cliente: [NOME DO CLIENTE]
Setor: [NOME DO SETOR]
----------------------------------------

ITENS DO PEDIDO:

Qtd  Descrição
---- ----------------------------------
XX   [PRODUTO/SERVIÇO 1]
     [Descrição customizada]

XX   [PRODUTO/SERVIÇO 2]
     [Descrição customizada]

========================================
Status: [PENDENTE/EXECUTADO]
========================================
```

**Requisitos Técnicos:**
- Largura: 80 colunas
- Formatação para impressora térmica
- Geração de PDF como alternativa
- Botão "Imprimir" na tela de detalhes do pedido

---

### 3.9 Sistema de Checklist

**Funcionamento:**
1. Ao selecionar categoria "Coffee Break" no pedido
2. Sistema identifica produtos que possuem itens de checklist
3. Gera automaticamente lista de itens necessários

**Exemplo:**
```
CHECKLIST - Coffee Break

Pedido #123 - 05/01/2026

□ Salada de Frutas:
  □ Cumbuca
  □ Colher
  □ Concha

□ Café:
  □ Garrafa térmica
  □ Xícaras
  □ Açúcar
  □ Adoçante
```

**Recursos:**
- Marcar itens como conferidos
- Imprimir checklist
- Salvar checklist conferido no pedido

---

### 3.10 Dashboard

**Design do Dashboard:**
```css
.dashboard-container {
  background: linear-gradient(to bottom, #F8F9FA, #FFFFFF)
  padding: 32px
}

.metric-card {
  background: #FFFFFF
  border-radius: 12px
  padding: 24px
  border-left: 4px solid #FF8C42
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05)
}

.metric-value {
  font-size: 2rem
  font-weight: 600
  color: #FF8C42
}

.metric-label {
  font-size: 0.875rem
  color: #6C757D
  text-transform: uppercase
  letter-spacing: 0.05em
}
```

**Dashboard para Admin:**
- Valor total a receber (pedidos executados não pagos)
- Valor total recebido (mês atual)
- Número de pedidos em aberto
- Número de pedidos executados
- Número de orçamentos pendentes
- Taxa de conversão de orçamentos
- Gráfico de vendas (últimos 30 dias) - estilo clean
- Próximos eventos (calendário resumido)
- Pedidos pendentes de pagamento

**Dashboard para Usuário Simples:**
- Número de pedidos em aberto
- Número de pedidos executados
- Número de orçamentos pendentes
- Próximos eventos (calendário resumido)
- Atalhos para cadastro rápido

**Widgets:**
- Cards com métricas principais
- Calendário com eventos do dia
- Lista de tarefas pendentes
- Orçamentos aguardando aprovação

---

### 3.11 Configurações do Sistema

**Gestão da Empresa:**
- Upload de logomarca (exibida no sistema e impressões)
- Nome da empresa
- Dados para contato
- Configurações de impressora
- Validade padrão para orçamentos

**Gerenciamento de Usuários (apenas admin):**
- Adicionar/remover usuários
- Alterar permissões
- Resetar senhas

---

## 4. Fluxo de Trabalho

### 4.1 Fluxo do Orçamento

1. **Criação** → Status: Pendente
2. **Aprovação pelo Cliente** → Status: Aprovado
3. **Conversão em Pedido** → Gera pedido automaticamente
4. **Recusa** → Status: Recusado
5. **Expiração** → Status: Expirado (após data de validade)

### 4.2 Fluxo do Pedido

1. **Criação** → Status: Pendente (manual ou via orçamento)
2. **Execução/Entrega** → Status: Executado (registrar data/hora)
3. **Pagamento** → Status Pagamento: Pago (registrar data/hora)

**Possibilidades:**
- Cancelar pedido em qualquer etapa
- Editar pedido apenas se status = Pendente
- Registrar pagamento parcial (implementação futura)

---

## 5. Requisitos Não-Funcionais

### 5.1 Performance
- Carregamento de dashboard < 2 segundos
- Consultas ao banco otimizadas com índices
- Paginação para listas com mais de 50 itens

### 5.2 Segurança
- Row Level Security (RLS) no Supabase
- Validação de permissões em todas as operações
- Sanitização de inputs
- HTTPS obrigatório

### 5.3 Usabilidade
- Interface responsiva (mobile-first)
- Feedback visual para todas as ações
- Mensagens de erro claras
- Atalhos de teclado para operações frequentes
- Editor de texto rico para campos de descrição customizada

### 5.4 Compatibilidade
- Navegadores modernos (Chrome, Firefox, Safari, Edge)
- Dispositivos móveis (tablets e smartphones)

---

## 6. Políticas de Acesso (RLS - Supabase)

```sql
-- Usuários simples não podem ver valores
CREATE POLICY "users_cannot_see_values" ON produtos
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    ) OR TRUE
  );

-- Apenas admin pode ver relatórios financeiros
CREATE POLICY "admin_only_financial" ON pedidos
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Apenas admin pode ver valores em orçamentos
CREATE POLICY "admin_only_budget_values" ON orcamentos
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );
```

---

## 7. Cronograma de Desenvolvimento

### Fase 1 (Sprint 1-2): Fundação + Design System
- Implementação completa do Design System
- Estrutura do banco de dados
- Autenticação e autorização
- CRUD de clientes
- CRUD de categorias
- CRUD de produtos/serviços

### Fase 2 (Sprint 3-4): Orçamentos e Pedidos
- Sistema de orçamentos completo
- Sistema de pedidos
- Conversão orçamento → pedido
- Editor de descrição customizada

### Fase 3 (Sprint 5-6): Visualização e Operações
- Visualização em calendário (design clean)
- Dashboard com métricas e gráficos clean
- Sistema de impressão (pedidos e orçamentos)

### Fase 4 (Sprint 7-8): Operações Avançadas
- Checklist automático
- Gestão de status
- Relatórios com visualizações clean

### Fase 5 (Sprint 9): Polimento
- Upload de logomarca
- Configurações
- Testes e ajustes finais
- Refinamento visual

---

## 8. Critérios de Aceitação

### 8.1 Design e Identidade Visual
- ✓ Paleta de cores clara implementada (sem roxo, sem cores escuras)
- ✓ Tipografia clean e legível
- ✓ Gráficos com estilo clean e minimalista
- ✓ Animações suaves e discretas
- ✓ Responsividade em todos os dispositivos

### 8.2 Cadastro de Clientes (CRUD)
- ✓ Criar cliente com campos obrigatórios mínimos
- ✓ CPF/CNPJ e endereço opcionais
- ✓ Campos condicionais todos opcionais
- ✓ Editar clientes
- ✓ Excluir/inativar clientes
- ✓ Listar e buscar clientes

### 8.3 Cadastro de Categorias (CRUD)
- ✓ Criar novas categorias
- ✓ Editar categorias existentes
- ✓ Excluir/inativar categorias
- ✓ Validar exclusão com produtos vinculados

### 8.4 Cadastro de Produtos (CRUD)
- ✓ Criar produtos por categoria
- ✓ Valores visíveis apenas para admin
- ✓ Associar itens de checklist
- ✓ Editar e excluir produtos

### 8.5 Orçamentos
- ✓ Criar orçamento com itens
- ✓ Editar descrição do produto no orçamento
- ✓ Editar valor unitário no orçamento
- ✓ Campo livre para condições comerciais
- ✓ Imprimir orçamento
- ✓ Converter orçamento aprovado em pedido

### 8.6 Pedidos
- ✓ Criar pedido com múltiplos itens
- ✓ Editar descrição do produto no pedido
- ✓ Editar valor unitário no pedido (apenas admin)
- ✓ Visualizar em calendário
- ✓ Alterar status (pendente → executado → pago)
- ✓ Imprimir em impressora térmica
- ✓ Gerar checklist automático

### 8.7 Dashboard
- ✓ Admin vê métricas financeiras e de orçamentos
- ✓ Usuário simples vê apenas operacionais
- ✓ Gráficos com design clean
- ✓ Atualização em tempo real

---

## 9. Observações Importantes para Implementação no Lovable

1. **Design System**: Implementar PRIMEIRO o design system completo com cores, tipografia e componentes definidos
2. **Banco de Dados**: Configurar conexão com Supabase existente usando as credenciais fornecidas
3. **Autenticação**: Implementar Supabase Auth com roles customizados
4. **Calendário**: Utilizar biblioteca como `react-big-calendar` ou `FullCalendar` com customização de cores
5. **Gráficos**: Utilizar Recharts ou Chart.js com configurações clean
6. **Editor de Texto**: Implementar editor rico (TinyMCE, Quill ou similar) para descrições customizadas
7. **Impressão**: Implementar formatação específica para impressora térmica (usar `react-to-print` ou similar)
8. **Upload**: Implementar Supabase Storage para logomarca
9. **Permissões**: Implementar verificação de roles em nível de componente
10. **Validações**: Implementar validações de exclusão para entidades com relacionamentos
11. **Cores**: NUNCA usar roxo, preto puro ou cores muito escuras
12. **Tipografia**: Usar fontes sans-serif modernas e clean (Inter, Poppins, Open Sans ou Nunito)

---

## 10. Próximos Passos

1. Revisar e aprovar PRD atualizado com design system
2. Criar estrutura completa do banco de dados no Supabase
3. Configurar autenticação e roles
4. Implementar design system base
5. Iniciar desenvolvimento no Lovable seguindo as fases definidas
6. Testes em ambiente de homologação
7. Deploy na VPS

---

**Documento criado em**: 04/01/2026  
**Versão**: 3.0  
**Status**: Pronto para desenvolvimento  
**Alterações**: Design System completo com paleta de cores clara (sem roxo/escuro), tipografia clean, especificações de gráficos minimalistas e componentes de interface