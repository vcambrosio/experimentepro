import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Search, Eye, Edit, Trash2, Loader2, Calendar, Filter, CheckCircle, XCircle, Clock, DollarSign, ArrowUp, ArrowUpDown, ArrowDown, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { usePedidos, useDeletePedido, useUpdatePedido } from '@/hooks/usePedidos';
import { useCreateLancamento } from '@/hooks/useFinanceiro';
import { useAuth } from '@/contexts/AuthContext';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { Pedido, StatusPedido, StatusPagamento, LancamentoFinanceiro } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PedidoFormDialog } from '@/components/pedidos/PedidoFormDialog';
import { PedidoViewDialog } from '@/components/pedidos/PedidoViewDialog';
import { LancamentoFormDialog } from '@/components/financeiro/LancamentoFormDialog';

const statusLabels: Record<StatusPedido, string> = {
  pendente: 'Pendente',
  executado: 'Executado',
  cancelado: 'Cancelado',
};

const statusPagamentoLabels: Record<StatusPagamento, string> = {
  pendente: 'A Pagar',
  pago: 'Pago',
};

const getStatusBadgeClass = (status: StatusPedido) => {
  switch (status) {
    case 'pendente':
      return 'bg-warning text-warning-foreground';
    case 'executado':
      return 'bg-success text-success-foreground';
    case 'cancelado':
      return 'bg-destructive text-destructive-foreground';
    default:
      return '';
  }
};

const getPagamentoBadgeClass = (status: StatusPagamento) => {
  switch (status) {
    case 'pendente':
      return 'bg-warning text-warning-foreground';
    case 'pago':
      return 'bg-success text-success-foreground';
    default:
      return '';
  }
};

type SortColumn = 'data' | 'cliente' | 'setor' | 'status' | 'pagamento' | 'valor';
type SortDirection = 'asc' | 'desc';

export default function Pedidos() {
  const { isAdmin } = useAuth();
  const { setHeader } = usePageHeader();

  useEffect(() => {
    setHeader('Pedidos de Evento ou Cesta', 'Gerencie seus pedidos de evento ou cesta de entrega');
  }, [setHeader]);
  const { data: pedidos, isLoading, error } = usePedidos();
  const deletePedido = useDeletePedido();
  const updatePedido = useUpdatePedido();
  const createLancamento = useCreateLancamento();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagamentoFilter, setPagamentoFilter] = useState<string>('all');
  const [sortColumn, setSortColumn] = useState<SortColumn>('data');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lancamentoDialogOpen, setLancamentoDialogOpen] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [pedidoParaLancamento, setPedidoParaLancamento] = useState<Pedido | null>(null);
  const [newClienteId, setNewClienteId] = useState<string | null>(null);

  // Verifica se o usuário voltou da criação de um novo cliente e abre o diálogo
  useEffect(() => {
    const savedClienteId = localStorage.getItem('newClienteId');
    if (savedClienteId) {
      // Salva o ID do novo cliente e abre o diálogo
      setNewClienteId(savedClienteId);
      setFormDialogOpen(true);
      // Remove o flag para não abrir novamente
      localStorage.removeItem('newClienteId');
    }
  }, []);

  // Filtra apenas pedidos de Evento ou Cesta (tipo_pedido = 'evento_cesta')
  const pedidosEventoCesta = pedidos?.filter(pedido => {
    // Se tipo_pedido estiver definido, usa o novo campo
    if (pedido.tipo_pedido !== undefined) {
      return pedido.tipo_pedido === 'evento_cesta';
    }
    // Fallback para pedidos antigos sem tipo_pedido definido
    // Considera como Evento/Cesta se tiver setor_id definido OU se tiver orcamento_id
    // Pedidos sem setor e sem orçamento são considerados vendas de loja
    return !!pedido.setor_id || !!pedido.orcamento_id;
  });

  const filteredAndSortedPedidos = useMemo(() => {
    if (!pedidosEventoCesta) return [];

    // Primeiro aplica os filtros
    let filtered = pedidosEventoCesta.filter(pedido => {
      const matchesSearch =
        pedido.cliente?.nome?.toLowerCase().includes(search.toLowerCase()) ||
        pedido.id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || pedido.status === statusFilter;
      const matchesPagamento = pagamentoFilter === 'all' || pedido.status_pagamento === pagamentoFilter;
      return matchesSearch && matchesStatus && matchesPagamento;
    });

    // Depois aplica a ordenação
    return filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case 'data':
          comparison = new Date(a.data_hora_entrega).getTime() - new Date(b.data_hora_entrega).getTime();
          break;
        case 'cliente':
          const clienteA = a.cliente?.nome || '';
          const clienteB = b.cliente?.nome || '';
          comparison = clienteA.localeCompare(clienteB);
          break;
        case 'setor':
          const setorA = a.setor?.nome_setor || '';
          const setorB = b.setor?.nome_setor || '';
          comparison = setorA.localeCompare(setorB);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'pagamento':
          comparison = a.status_pagamento.localeCompare(b.status_pagamento);
          break;
        case 'valor':
          comparison = a.valor_total - b.valor_total;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [pedidosEventoCesta, search, statusFilter, pagamentoFilter, sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const handleCreate = () => {
    setSelectedPedido(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setFormDialogOpen(true);
  };

  const handleView = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setViewDialogOpen(true);
  };

  const handleDelete = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedPedido) {
      await deletePedido.mutateAsync(selectedPedido.id);
      setDeleteDialogOpen(false);
      setSelectedPedido(null);
    }
  };

  const handleStatusChange = async (pedido: Pedido, newStatus: StatusPedido) => {
    await updatePedido.mutateAsync({
      id: pedido.id,
      status: newStatus,
      executed_at: newStatus === 'executado' ? new Date().toISOString() : null,
    });
  };

  const handlePagamentoChange = async (pedido: Pedido, newStatus: StatusPagamento) => {
    if (newStatus === 'pago') {
      // Abrir diálogo de lançamento financeiro
      setPedidoParaLancamento(pedido);
      setLancamentoDialogOpen(true);
    } else {
      // Marcar como pendente diretamente
      await updatePedido.mutateAsync({
        id: pedido.id,
        status_pagamento: newStatus,
        paid_at: null,
      });
    }
  };

  const handleCreateLancamentoFromPedido = async (lancamento: Omit<LancamentoFinanceiro, 'id' | 'created_at' | 'updated_at' | 'categoria' | 'pedido'>) => {
    try {
      // Criar o lançamento financeiro
      await createLancamento.mutateAsync({
        ...lancamento,
        pedido_id: pedidoParaLancamento?.id,
      });

      // Atualizar o status do pedido para pago
      await updatePedido.mutateAsync({
        id: pedidoParaLancamento!.id,
        status_pagamento: 'pago',
        paid_at: new Date().toISOString(),
      });

      setLancamentoDialogOpen(false);
      setPedidoParaLancamento(null);
    } catch (error) {
      console.error('Erro ao criar lançamento:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleExportXLSX = () => {
    if (!pedidosEventoCesta || pedidosEventoCesta.length === 0) {
      return;
    }

    // Prepara os dados para exportação
    const data = pedidosEventoCesta.map((pedido) => ({
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

    // Cria a planilha
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Ajusta a largura das colunas
    const colWidths = [
      { wch: 25 }, // ID
      { wch: 30 }, // Cliente
      { wch: 25 }, // Setor
      { wch: 20 }, // Responsável Setor
      { wch: 20 }, // Contato Setor
      { wch: 15 }, // Data Entrega
      { wch: 15 }, // Hora Entrega
      { wch: 15 }, // Status
      { wch: 15 }, // Status Pagamento
      { wch: 15 }, // Valor Total
      { wch: 15 }, // Nota Fiscal
      { wch: 50 }, // Produtos
    ];
    ws['!cols'] = colWidths;

    // Cria o workbook e adiciona a planilha
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pedidos Evento Cesta');

    // Gera o nome do arquivo com data atual
    const fileName = `pedidos_evento_cesta_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.xlsx`;

    // Faz o download
    XLSX.writeFile(wb, fileName);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center text-destructive">
          <p>Erro ao carregar pedidos</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="executado">Executado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={pagamentoFilter} onValueChange={setPagamentoFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <DollarSign className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendente">A Pagar</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Pedido de Evento ou Cesta
        </Button>
        <Button
          variant="outline"
          onClick={handleExportXLSX}
          disabled={!pedidosEventoCesta || pedidosEventoCesta.length === 0}
          title="Exportar todos os pedidos para XLSX"
        >
          <Download className="mr-2 h-4 w-4" />
          Exportar XLSX
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredAndSortedPedidos?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-lg">
          <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Nenhum pedido de evento ou cesta encontrado</p>
          <Button variant="link" onClick={handleCreate} className="mt-2">
            Criar primeiro pedido de evento ou cesta
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('data')}
                >
                  <div className="flex items-center">
                    Data Entrega
                    {getSortIcon('data')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('cliente')}
                >
                  <div className="flex items-center">
                    Cliente
                    {getSortIcon('cliente')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('setor')}
                >
                  <div className="flex items-center">
                    Setor
                    {getSortIcon('setor')}
                  </div>
                </TableHead>
                <TableHead>Produtos</TableHead>
                <TableHead>Nota Fiscal</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    {getSortIcon('status')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('pagamento')}
                >
                  <div className="flex items-center">
                    Pagamento
                    {getSortIcon('pagamento')}
                  </div>
                </TableHead>
                {isAdmin && (
                  <TableHead
                    className="text-right cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort('valor')}
                  >
                    <div className="flex items-center justify-end">
                      Valor
                      {getSortIcon('valor')}
                    </div>
                  </TableHead>
                )}
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedPedidos?.map((pedido) => (
                <TableRow key={pedido.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {format(new Date(pedido.data_hora_entrega), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(pedido.data_hora_entrega), 'HH:mm', { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {pedido.cliente?.nome || 'Cliente não encontrado'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{pedido.setor?.nome_setor || '-'}</span>
                      {pedido.setor?.responsavel && (
                        <span className="text-xs text-muted-foreground">
                          Resp: {pedido.setor.responsavel}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {pedido.itens && pedido.itens.length > 0 ? (
                        pedido.itens.map((item, index) => (
                          <div key={index} className="text-sm">
                            <div className="font-medium">
                              {item.produto?.nome || 'Produto não encontrado'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Qtd: {item.quantidade} | Valor: {formatCurrency(item.valor_unitario)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                      {pedido.itens && pedido.itens.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{pedido.itens.length - 3} produtos
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {pedido.emite_nota_fiscal ? (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        Sim
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Não
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="p-0 h-auto">
                          <Badge className={getStatusBadgeClass(pedido.status)}>
                            {statusLabels[pedido.status]}
                          </Badge>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleStatusChange(pedido, 'pendente')}>
                          <Clock className="mr-2 h-4 w-4" />
                          Pendente
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(pedido, 'executado')}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Executado
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(pedido, 'cancelado')}
                          className="text-destructive"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancelado
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="p-0 h-auto">
                          <Badge className={getPagamentoBadgeClass(pedido.status_pagamento)}>
                            {statusPagamentoLabels[pedido.status_pagamento]}
                          </Badge>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handlePagamentoChange(pedido, 'pendente')}>
                          <Clock className="mr-2 h-4 w-4" />
                          A Pagar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePagamentoChange(pedido, 'pago')}>
                          <DollarSign className="mr-2 h-4 w-4" />
                          Registrar Pagamento
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right font-medium">
                      {formatCurrency(pedido.valor_total)}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleView(pedido)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(pedido)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(pedido)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Form Dialog */}
      <PedidoFormDialog
        open={formDialogOpen}
        onOpenChange={(open) => {
          setFormDialogOpen(open);
          if (!open) {
            setNewClienteId(null);
          }
        }}
        pedido={selectedPedido}
        newClienteId={newClienteId}
      />

      {/* View Dialog */}
      <PedidoViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        pedidoId={selectedPedido?.id}
        isVendaLoja={false}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este pedido de evento ou cesta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePedido.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lançamento Financeiro Dialog */}
      <LancamentoFormDialog
        open={lancamentoDialogOpen}
        onOpenChange={setLancamentoDialogOpen}
        onSubmit={handleCreateLancamentoFromPedido}
        pedidoParaLancamento={pedidoParaLancamento ? {
          id: pedidoParaLancamento.id,
          valor_total: pedidoParaLancamento.valor_total,
          cliente: pedidoParaLancamento.cliente,
        } : undefined}
        isLoading={createLancamento.isPending || updatePedido.isPending}
      />
    </div>
  );
}