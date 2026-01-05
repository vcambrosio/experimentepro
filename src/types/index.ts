// Types for Experimente Pro

export type TipoPessoa = 'fisica' | 'juridica';
export type TipoFinanceiro = 'receita' | 'despesa';
export type StatusLancamento = 'pendente' | 'realizado' | 'cancelado';
export type StatusOrcamento = 'pendente' | 'aprovado' | 'recusado' | 'expirado' | 'perdido';
export type StatusPedido = 'pendente' | 'executado' | 'cancelado';
export type StatusPagamento = 'pendente' | 'pago';

export interface Cliente {
  id: string;
  nome: string;
  tipo_pessoa: TipoPessoa;
  cpf_cnpj?: string;
  endereco?: string;
  contato?: string;
  telefone?: string;
  email?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface SetorCliente {
  id: string;
  cliente_id: string;
  nome_setor?: string;
  responsavel?: string;
  contato?: string;
  created_at: string;
}

export interface Categoria {
  id: string;
  nome: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Produto {
  id: string;
  categoria_id: string;
  nome: string;
  descricao_padrao?: string;
  valor_venda: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  categoria?: Categoria;
}

export type TipoCalculoChecklist = 'unitario' | 'multiplo';

export interface ChecklistItem {
  id: string;
  produto_id: string;
  descricao: string;
  quantidade_por_unidade: number;
  tipo_calculo: TipoCalculoChecklist;
  ordem: number;
  created_at: string;
}

export interface Orcamento {
  id: string;
  numero_orcamento: string;
  data_orcamento: string;
  cliente_id: string;
  setor_id?: string;
  descricao?: string;
  condicoes_comerciais?: string;
  valor_total: number;
  status: StatusOrcamento;
  validade?: string;
  data_entrega?: string;
  hora_entrega?: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  cliente?: Cliente;
  setor?: SetorCliente;
  itens?: ItemOrcamento[];
}

export interface ItemOrcamento {
  id: string;
  orcamento_id: string;
  produto_id: string;
  categoria_id: string;
  descricao_customizada?: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  observacoes?: string;
  created_at: string;
  produto?: Produto;
  categoria?: Categoria;
}

export interface Pedido {
  id: string;
  cliente_id: string;
  setor_id?: string;
  orcamento_id?: string;
  data_hora_entrega: string;
  status: StatusPedido;
  status_pagamento: StatusPagamento;
  valor_total: number;
  emite_nota_fiscal: boolean;
  created_at: string;
  created_by: string;
  executed_at?: string;
  paid_at?: string;
  updated_at: string;
  cliente?: Cliente;
  setor?: SetorCliente;
  orcamento?: Orcamento;
  itens?: ItemPedido[];
}

export interface ItemPedido {
  id: string;
  pedido_id: string;
  produto_id: string;
  categoria_id: string;
  descricao_customizada?: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  detalhes?: string;
  created_at: string;
  produto?: Produto;
  categoria?: Categoria;
}

export interface ConfiguracaoEmpresa {
  id: string;
  nome_empresa: string;
  logo_url?: string;
  logo_pdf_url?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  validade_orcamento_dias: number;
  updated_at: string;
}

export interface CategoriaFinanceira {
  id: string;
  nome: string;
  tipo: TipoFinanceiro;
  descricao?: string;
  ativo: boolean;
  cor: string;
  created_at: string;
  updated_at: string;
}

export interface LancamentoFinanceiro {
  id: string;
  tipo: TipoFinanceiro;
  categoria_id: string;
  descricao: string;
  valor: number;
  data_lancamento: string;
  data_pagamento?: string;
  status: StatusLancamento;
  forma_pagamento?: string;
  observacoes?: string;
  pedido_id?: string;
  recorrente: boolean;
  recorrencia_periodo?: 'mensal' | 'trimestral' | 'semestral' | 'anual';
  created_at: string;
  created_by?: string;
  updated_at: string;
  categoria?: CategoriaFinanceira;
  pedido?: Pedido;
}

export interface FluxoCaixa {
  data: string;
  receitas: number;
  despesas: number;
  saldo: number;
  receitas_realizadas: number;
  despesas_realizadas: number;
  saldo_realizado: number;
}

export interface Balanco {
  periodo: string;
  totalReceitas: number;
  totalDespesas: number;
  lucro: number;
  receitasPorCategoria: Array<{
    categoria: string;
    valor: number;
    porcentagem: number;
  }>;
  despesasPorCategoria: Array<{
    categoria: string;
    valor: number;
    porcentagem: number;
  }>;
}