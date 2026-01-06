import { useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { usePedidos } from '@/hooks/usePedidos';
import { useOrcamentos } from '@/hooks/useOrcamentos';
import { useClientes } from '@/hooks/useClientes';
import { useProdutos } from '@/hooks/useProdutos';
import { useCategorias } from '@/hooks/useCategorias';
import { useLancamentosFinanceiros } from '@/hooks/useFinanceiro';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Clock,
  CheckCircle,
  DollarSign,
  TrendingUp,
  Users,
  Package,
  FileText,
  Download
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarioWidget } from '@/components/calendario/CalendarioWidget';
import * as XLSX from 'xlsx';

export default function Dashboard() {
  const { isAdmin, profile } = useAuth();
  const { setHeader } = usePageHeader();

  useEffect(() => {
    setHeader(`Olá${profile?.full_name ? `, ${profile.full_name}` : ''}! 👋`, 'Visão geral do seu negócio');
  }, [profile, setHeader]);
  const { data: pedidos, isLoading: loadingPedidos } = usePedidos();
  const { data: orcamentos, isLoading: loadingOrcamentos } = useOrcamentos();
  const { data: clientes, isLoading: loadingClientes } = useClientes();
  const { data: produtos, isLoading: loadingProdutos } = useProdutos();
  const { data: categorias, isLoading: loadingCategorias } = useCategorias();
  const { data: lancamentosFinanceiros, isLoading: loadingLancamentos } = useLancamentosFinanceiros();

  const totalClientes = clientes?.filter(c => c.ativo).length || 0;
  const totalProdutos = produtos?.filter(p => p.ativo).length || 0;
  
  const valorAReceber = pedidos
    ?.filter(p => p.status === 'executado' && p.status_pagamento === 'pendente')
    .reduce((acc, p) => acc + (p.valor_total || 0), 0) || 0;
  
  const valorRecebido = pedidos
    ?.filter(p => p.status_pagamento === 'pago')
    .reduce((acc, p) => acc + (p.valor_total || 0), 0) || 0;

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleExportAll = () => {
    if (!orcamentos && !pedidos && !clientes && !produtos && !categorias && !lancamentosFinanceiros) {
      return;
    }

    try {
      const wb = XLSX.utils.book_new();

      // Aba: Orçamentos
      if (orcamentos && orcamentos.length > 0) {
        const statusLabels: Record<string, string> = {
          pendente: 'Pendente',
          aprovado: 'Aprovado',
          recusado: 'Recusado',
          expirado: 'Expirado',
          perdido: 'Perdido',
        };
        
        const orcamentosData = orcamentos.map((orcamento) => ({
          'Número Orçamento': orcamento.numero_orcamento || '',
          'Cliente': orcamento.cliente?.nome || '',
          'Setor': orcamento.setor?.nome_setor || '',
          'Responsável Setor': orcamento.setor?.responsavel || '',
          'Contato Setor': orcamento.setor?.contato || '',
          'Data Orçamento': format(new Date(orcamento.data_orcamento), 'dd/MM/yyyy', { locale: ptBR }),
          'Data Entrega': orcamento.data_entrega ? format(new Date(orcamento.data_entrega + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR }) : '',
          'Hora Entrega': orcamento.hora_entrega || '',
          'Status': statusLabels[orcamento.status],
          'Valor Total': orcamento.valor_total,
          'Descrição': orcamento.descricao || '',
        }));

        const wsOrcamentos = XLSX.utils.json_to_sheet(orcamentosData);
        wsOrcamentos['!cols'] = [
          { wch: 20 }, { wch: 30 }, { wch: 25 }, { wch: 20 }, { wch: 20 },
          { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 50 }
        ];
        XLSX.utils.book_append_sheet(wb, wsOrcamentos, 'Orçamentos');
      }

      // Aba: Pedidos de Evento ou Cesta
      if (pedidos) {
        const pedidosEventoCesta = pedidos.filter(pedido => {
          if (pedido.tipo_pedido !== undefined) {
            return pedido.tipo_pedido === 'evento_cesta';
          }
          return !!pedido.setor_id || !!pedido.orcamento_id;
        });

        if (pedidosEventoCesta.length > 0) {
          const statusLabels: Record<string, string> = {
            pendente: 'Pendente',
            executado: 'Executado',
            cancelado: 'Cancelado',
          };
          
          const statusPagamentoLabels: Record<string, string> = {
            pendente: 'A Pagar',
            pago: 'Pago',
          };

          const pedidosData = pedidosEventoCesta.map((pedido) => ({
            'ID': pedido.id,
            'Cliente': pedido.cliente?.nome || '',
            'Setor': pedido.setor?.nome_setor || '',
            'Responsável Setor': pedido.setor?.responsavel || '',
            'Contato Setor': pedido.setor?.contato || '',
            'Data Entrega': format(new Date(pedido.data_hora_entrega), 'dd/MM/yyyy', { locale: ptBR }),
            'Hora Entrega': format(new Date(pedido.data_hora_entrega), 'HH:mm', { locale: ptBR }),
            'Status': statusLabels[pedido.status],
            'Status Pagamento': statusPagamentoLabels[pedido.status_pagamento],
            'Valor Total': pedido.valor_total,
            'Nota Fiscal': pedido.emite_nota_fiscal ? 'Sim' : 'Não',
            'Produtos': pedido.itens?.map(item => `${item.produto?.nome || ''} (${item.quantidade}x)`).join('; ') || '',
          }));

          const wsPedidos = XLSX.utils.json_to_sheet(pedidosData);
          wsPedidos['!cols'] = [
            { wch: 25 }, { wch: 30 }, { wch: 25 }, { wch: 20 }, { wch: 20 },
            { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 50 }
          ];
          XLSX.utils.book_append_sheet(wb, wsPedidos, 'Pedidos Evento Cesta');
        }
      }

      // Aba: Venda Loja
      if (pedidos) {
        const vendasLoja = pedidos.filter(pedido => {
          if (pedido.tipo_pedido !== undefined) {
            return pedido.tipo_pedido === 'venda_loja';
          }
          return !pedido.setor_id && !pedido.orcamento_id;
        });

        if (vendasLoja.length > 0) {
          const statusLabels: Record<string, string> = {
            pendente: 'Pendente',
            executado: 'Executado',
            cancelado: 'Cancelado',
          };
          
          const statusPagamentoLabels: Record<string, string> = {
            pendente: 'A Pagar',
            pago: 'Pago',
          };

          const vendasData = vendasLoja.map((pedido) => ({
            'ID': pedido.id,
            'Cliente': pedido.cliente?.nome || '',
            'Data Venda': format(new Date(pedido.created_at), 'dd/MM/yyyy', { locale: ptBR }),
            'Hora Venda': format(new Date(pedido.created_at), 'HH:mm', { locale: ptBR }),
            'Status': statusLabels[pedido.status],
            'Status Pagamento': statusPagamentoLabels[pedido.status_pagamento],
            'Valor Total': pedido.valor_total,
            'Nota Fiscal': pedido.emite_nota_fiscal ? 'Sim' : 'Não',
            'Produtos': pedido.itens?.map(item => `${item.produto?.nome || ''} (${item.quantidade}x)`).join('; ') || '',
          }));

          const wsVendas = XLSX.utils.json_to_sheet(vendasData);
          wsVendas['!cols'] = [
            { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
            { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 50 }
          ];
          XLSX.utils.book_append_sheet(wb, wsVendas, 'Vendas Loja');
        }
      }

      // Aba: Clientes
      if (clientes && clientes.length > 0) {
        const clientesData = clientes.map((cliente) => ({
          'Nome': cliente.nome,
          'Tipo Pessoa': cliente.tipo_pessoa === 'juridica' ? 'Pessoa Jurídica' : 'Pessoa Física',
          'CPF/CNPJ': cliente.cpf_cnpj || '',
          'Contato': cliente.contato || '',
          'Telefone': cliente.telefone || '',
          'Email': cliente.email || '',
          'Status': cliente.ativo ? 'Ativo' : 'Inativo',
          'Setores': (cliente as any).setores_cliente?.map((s: any) => s.nome_setor).join('; ') || '',
        }));

        const wsClientes = XLSX.utils.json_to_sheet(clientesData);
        wsClientes['!cols'] = [
          { wch: 40 }, { wch: 20 }, { wch: 25 }, { wch: 30 }, { wch: 20 },
          { wch: 35 }, { wch: 15 }, { wch: 40 }
        ];
        XLSX.utils.book_append_sheet(wb, wsClientes, 'Clientes');
      }

      // Aba: Produtos
      if (produtos && produtos.length > 0) {
        const produtosData = produtos.map((produto) => ({
          'Nome': produto.nome,
          'Categoria': produto.categoria?.nome || 'Sem categoria',
          'Descrição Padrão': produto.descricao_padrao || '',
          'Valor Venda': produto.valor_venda,
          'Status': produto.ativo ? 'Ativo' : 'Inativo',
        }));

        const wsProdutos = XLSX.utils.json_to_sheet(produtosData);
        wsProdutos['!cols'] = [
          { wch: 40 }, { wch: 25 }, { wch: 50 }, { wch: 15 }, { wch: 15 }
        ];
        XLSX.utils.book_append_sheet(wb, wsProdutos, 'Produtos');
      }

      // Aba: Categorias
      if (categorias && categorias.length > 0) {
        const categoriasData = categorias.map((categoria) => ({
          'Nome': categoria.nome,
          'Status': categoria.ativo ? 'Ativa' : 'Inativa',
          'Criada em': new Date(categoria.created_at).toLocaleDateString('pt-BR'),
        }));

        const wsCategorias = XLSX.utils.json_to_sheet(categoriasData);
        wsCategorias['!cols'] = [
          { wch: 40 }, { wch: 15 }, { wch: 20 }
        ];
        XLSX.utils.book_append_sheet(wb, wsCategorias, 'Categorias');
      }

      // Aba: Lançamentos Financeiros
      if (lancamentosFinanceiros && lancamentosFinanceiros.length > 0) {
        const lancamentosData = lancamentosFinanceiros.map(lancamento => {
          const dataObj = new Date(lancamento.data_lancamento);
          const dataFormatada = format(dataObj, 'dd/MM/yyyy');
          
          return {
            'Data': dataFormatada,
            'Tipo': lancamento.tipo === 'receita' ? 'receita' : 'despesa',
            'Categoria': lancamento.categoria?.nome || '',
            'Descrição': lancamento.descricao || '',
            'Valor': lancamento.valor,
            'Status': lancamento.status === 'realizado' ? 'realizado' : 'pendente',
            'Forma de Pagamento': lancamento.forma_pagamento || '',
            'Observações': lancamento.observacoes || ''
          };
        });

        const wsLancamentos = XLSX.utils.json_to_sheet(lancamentosData);
        wsLancamentos['!cols'] = [
          { wch: 15 }, { wch: 10 }, { wch: 20 }, { wch: 30 },
          { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 30 }
        ];
        XLSX.utils.book_append_sheet(wb, wsLancamentos, 'Lançamentos Financeiros');
      }

      // Gerar nome do arquivo e baixar
      const fileName = `exportacao_completa_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Erro ao exportar dados completos:', error);
    }
  };

  const isLoading = loadingPedidos || loadingOrcamentos || loadingClientes || loadingProdutos || loadingCategorias || loadingLancamentos;


  return (
    <div className="space-y-6">
      {/* Calendário - Pedidos de Evento ou Cesta e Orçamentos de Cestas/Coffee Break */}
      <CalendarioWidget
        pedidos={pedidos?.filter(pedido => {
          const dataCriacao = new Date(pedido.created_at);
          const dataEntrega = new Date(pedido.data_hora_entrega);
          // Exclui vendas de loja (onde data de entrega é igual à data de criação)
          return dataCriacao.toDateString() !== dataEntrega.toDateString();
        }) || []}
        orcamentos={orcamentos?.filter(orcamento => {
          // Filtra orçamentos com data_entrega definida
          if (!orcamento.data_entrega) {
            return false;
          }
          
          // Filtra por categoria (apenas cestas e coffee break)
          if (orcamento.itens && orcamento.itens.length > 0) {
            const categoriaNome = orcamento.itens[0].categoria?.nome?.toLowerCase() || '';
            return categoriaNome.includes('cesta') ||
                   categoriaNome.includes('basket') ||
                   categoriaNome.includes('coffee') ||
                   categoriaNome.includes('café') ||
                   categoriaNome.includes('cafe');
          }
          
          return false;
        }) || []}
        isLoading={isLoading}
      />

      {/* Cards principais */}
      {isAdmin && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">A Receber</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-2xl font-bold text-primary">{formatCurrency(valorAReceber)}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">pagamento pendente</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-success hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Recebido</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-2xl font-bold text-success">{formatCurrency(valorRecebido)}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">total recebido</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-secondary hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Clientes Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold">{totalClientes}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">cadastrados</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-secondary hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Produtos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold">{totalProdutos}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">no catálogo</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Botão de Exportação Completa */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={handleExportAll}
          disabled={isLoading}
          title="Exportar todos os dados para XLSX"
        >
          <Download className="mr-2 h-4 w-4" />
          Exportar XLSX Completo
        </Button>
      </div>
    </div>
  );
}