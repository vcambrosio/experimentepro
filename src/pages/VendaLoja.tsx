import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Search, Eye, Edit, Trash2, Loader2, Store, Filter, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import { usePedidos, useDeletePedido, useUpdatePedido } from '@/hooks/usePedidos';
import { useCreateLancamento } from '@/hooks/useFinanceiro';
import { useAuth } from '@/contexts/AuthContext';
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
import { VendaLojaFormDialog } from '@/components/vendas-loja/VendaLojaFormDialog';
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

export default function VendaLoja() {
  const { isAdmin } = useAuth();
  const { data: pedidos, isLoading, error } = usePedidos();
  const deletePedido = useDeletePedido();
  const updatePedido = useUpdatePedido();
  const createLancamento = useCreateLancamento();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagamentoFilter, setPagamentoFilter] = useState<string>('all');
  
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

  // Filtra apenas vendas de loja (pedidos com data de entrega igual à data de criação ou status executado)
  const vendasLoja = pedidos?.filter(pedido => {
    const dataCriacao = new Date(pedido.created_at);
    const dataEntrega = new Date(pedido.data_hora_entrega);
    // Considera como venda de loja se a data de entrega for próxima da data de criação (mesmo dia)
    return (
      dataCriacao.toDateString() === dataEntrega.toDateString() &&
      pedido.status === 'executado'
    );
  });

  const filteredPedidos = vendasLoja?.filter(pedido => {
    const matchesSearch = 
      pedido.cliente?.nome?.toLowerCase().includes(search.toLowerCase()) ||
      pedido.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || pedido.status === statusFilter;
    const matchesPagamento = pagamentoFilter === 'all' || pedido.status_pagamento === pagamentoFilter;
    return matchesSearch && matchesStatus && matchesPagamento;
  });

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

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center text-destructive">
          <p>Erro ao carregar vendas de loja</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Venda Loja</h1>
          <p className="text-muted-foreground">Gerencie as vendas de loja de produtos</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Venda de Loja
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
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
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredPedidos?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-lg">
          <Store className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Nenhuma venda de loja encontrada</p>
          <Button variant="link" onClick={handleCreate} className="mt-2">
            Registrar primeira venda de loja
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data Venda</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Produtos</TableHead>
                <TableHead>Nota Fiscal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pagamento</TableHead>
                {isAdmin && <TableHead className="text-right">Valor</TableHead>}
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPedidos?.map((pedido) => (
                <TableRow key={pedido.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {format(new Date(pedido.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(pedido.created_at), 'HH:mm', { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {pedido.cliente?.nome || 'Cliente não encontrado'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      {pedido.itens && pedido.itens.length > 0 ? (
                        pedido.itens.slice(0, 3).map((item, index) => (
                          <span key={index} className="text-sm">
                            {item.produto?.nome || 'Produto não encontrado'}
                          </span>
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
      <VendaLojaFormDialog
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
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta venda de loja? Esta ação não pode ser desfeita.
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
        isVendaLoja={true}
      />
    </div>
  );
}
