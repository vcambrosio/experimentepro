import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Search, Eye, Edit, Trash2, Loader2, Filter, FileText, ArrowRight, CheckCircle, XCircle, Clock, X, ArrowUp, ArrowUpDown, ArrowDown, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useOrcamentos, useDeleteOrcamento, useUpdateOrcamento, useConvertOrcamentoToPedido } from '@/hooks/useOrcamentos';
import { useAuth } from '@/contexts/AuthContext';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { Orcamento, StatusOrcamento } from '@/types';
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
import { OrcamentoFormDialog } from '@/components/orcamentos/OrcamentoFormDialog';
import { OrcamentoViewDialog } from '@/components/orcamentos/OrcamentoViewDialog';

const statusLabels: Record<StatusOrcamento, string> = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
  expirado: 'Expirado',
  perdido: 'Perdido',
};

const getStatusBadgeClass = (status: StatusOrcamento) => {
  switch (status) {
    case 'pendente':
      return 'bg-warning text-warning-foreground';
    case 'aprovado':
      return 'bg-success text-success-foreground';
    case 'recusado':
      return 'bg-destructive text-destructive-foreground';
    case 'expirado':
      return 'bg-muted text-muted-foreground';
    case 'perdido':
      return 'bg-muted text-muted-foreground';
    default:
      return '';
  }
};

type SortColumn = 'numero' | 'cliente' | 'data' | 'entrega' | 'status' | 'valor';
type SortDirection = 'asc' | 'desc';

export default function Orcamentos() {
  const { isAdmin } = useAuth();
  const { setHeader } = usePageHeader();

  useEffect(() => {
    setHeader('Orçamentos', 'Gerencie seus orçamentos e propostas');
  }, [setHeader]);
  const { data: orcamentos, isLoading, error } = useOrcamentos();
  const deleteOrcamento = useDeleteOrcamento();
  const updateOrcamento = useUpdateOrcamento();
  const convertToPedido = useConvertOrcamentoToPedido();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortColumn, setSortColumn] = useState<SortColumn>('data');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedOrcamento, setSelectedOrcamento] = useState<Orcamento | null>(null);
  const [newClienteId, setNewClienteId] = useState<string | null>(null);

  // Verifica se há um novo cliente criado para selecionar automaticamente
  useEffect(() => {
    const savedClienteId = localStorage.getItem('newClienteId');
    if (savedClienteId) {
      setNewClienteId(savedClienteId);
      setFormDialogOpen(true);
      localStorage.removeItem('newClienteId');
    }
  }, []);

  const filteredAndSortedOrcamentos = useMemo(() => {
    if (!orcamentos) return [];

    // Primeiro aplica os filtros
    let filtered = orcamentos.filter(orcamento => {
      const matchesSearch =
        orcamento.cliente?.nome?.toLowerCase().includes(search.toLowerCase()) ||
        orcamento.numero_orcamento?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || orcamento.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Depois aplica a ordenação
    return filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case 'numero':
          comparison = (a.numero_orcamento || '').localeCompare(b.numero_orcamento || '');
          break;
        case 'cliente':
          const clienteA = a.cliente?.nome || '';
          const clienteB = b.cliente?.nome || '';
          comparison = clienteA.localeCompare(clienteB);
          break;
        case 'data':
          comparison = new Date(a.data_orcamento).getTime() - new Date(b.data_orcamento).getTime();
          break;
        case 'entrega':
          const entregaA = a.data_entrega ? new Date(a.data_entrega).getTime() : 0;
          const entregaB = b.data_entrega ? new Date(b.data_entrega).getTime() : 0;
          comparison = entregaA - entregaB;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'valor':
          comparison = a.valor_total - b.valor_total;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [orcamentos, search, statusFilter, sortColumn, sortDirection]);

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
    setSelectedOrcamento(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (orcamento: Orcamento) => {
    setSelectedOrcamento(orcamento);
    setFormDialogOpen(true);
  };

  const handleView = (orcamento: Orcamento) => {
    setSelectedOrcamento(orcamento);
    setViewDialogOpen(true);
  };

  const handleDelete = (orcamento: Orcamento) => {
    setSelectedOrcamento(orcamento);
    setDeleteDialogOpen(true);
  };

  const handleConvert = (orcamento: Orcamento) => {
    setSelectedOrcamento(orcamento);
    setConvertDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedOrcamento) {
      await deleteOrcamento.mutateAsync(selectedOrcamento.id);
      setDeleteDialogOpen(false);
      setSelectedOrcamento(null);
    }
  };

  const confirmConvert = async () => {
    if (selectedOrcamento) {
      await convertToPedido.mutateAsync(selectedOrcamento.id);
      setConvertDialogOpen(false);
      setSelectedOrcamento(null);
    }
  };

  const handleStatusChange = async (orcamento: Orcamento, newStatus: StatusOrcamento) => {
    await updateOrcamento.mutateAsync({
      id: orcamento.id,
      status: newStatus,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleExportXLSX = () => {
    if (!orcamentos || orcamentos.length === 0) {
      return;
    }

    // Prepara os dados para exportação
    const data = orcamentos.map((orcamento) => ({
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

    // Cria a planilha
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Ajusta a largura das colunas
    const colWidths = [
      { wch: 20 }, // Número Orçamento
      { wch: 30 }, // Cliente
      { wch: 25 }, // Setor
      { wch: 20 }, // Responsável Setor
      { wch: 20 }, // Contato Setor
      { wch: 15 }, // Data Orçamento
      { wch: 15 }, // Data Entrega
      { wch: 15 }, // Hora Entrega
      { wch: 15 }, // Status
      { wch: 15 }, // Valor Total
      { wch: 50 }, // Descrição
    ];
    ws['!cols'] = colWidths;

    // Cria o workbook e adiciona a planilha
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orçamentos');

    // Gera o nome do arquivo com data atual
    const fileName = `orcamentos_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.xlsx`;

    // Faz o download
    XLSX.writeFile(wb, fileName);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center text-destructive">
          <p>Erro ao carregar orçamentos</p>
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
            placeholder="Buscar por cliente ou número..."
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
            <SelectItem value="aprovado">Aprovado</SelectItem>
            <SelectItem value="recusado">Recusado</SelectItem>
            <SelectItem value="expirado">Expirado</SelectItem>
            <SelectItem value="perdido">Perdido</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Orçamento
        </Button>
        <Button
          variant="outline"
          onClick={handleExportXLSX}
          disabled={!orcamentos || orcamentos.length === 0}
          title="Exportar todos os orçamentos para XLSX"
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
      ) : filteredAndSortedOrcamentos?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-lg">
          <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Nenhum orçamento encontrado</p>
          <Button variant="link" onClick={handleCreate} className="mt-2">
            Criar primeiro orçamento
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('numero')}
                >
                  <div className="flex items-center">
                    Número
                    {getSortIcon('numero')}
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
                  onClick={() => handleSort('data')}
                >
                  <div className="flex items-center">
                    Data
                    {getSortIcon('data')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('entrega')}
                >
                  <div className="flex items-center">
                    Entrega
                    {getSortIcon('entrega')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    {getSortIcon('status')}
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
                <TableHead className="w-[140px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedOrcamentos?.map((orcamento) => (
                <TableRow key={orcamento.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{orcamento.numero_orcamento}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{orcamento.cliente?.nome || 'Cliente não encontrado'}</p>
                      {orcamento.setor && (
                        <p className="text-sm text-muted-foreground">
                          {orcamento.setor.nome_setor}
                          {orcamento.setor.responsavel && ` (${orcamento.setor.responsavel})`}
                          {orcamento.setor.contato && ` - ${orcamento.setor.contato}`}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {format(new Date(orcamento.data_orcamento), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {orcamento.data_entrega && (
                      <div>
                        <p className="font-medium">
                          {format(new Date(orcamento.data_entrega + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                        {orcamento.hora_entrega && (
                          <p className="text-sm text-muted-foreground">{orcamento.hora_entrega}</p>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="p-0 h-auto">
                          <Badge className={getStatusBadgeClass(orcamento.status)}>
                            {statusLabels[orcamento.status]}
                          </Badge>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleStatusChange(orcamento, 'pendente')}>
                          <Clock className="mr-2 h-4 w-4" />
                          Pendente
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(orcamento, 'aprovado')}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Aprovado
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(orcamento, 'recusado')}
                          className="text-destructive"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Recusado
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(orcamento, 'perdido')}
                          className="text-destructive"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Perdido
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right font-medium text-primary">
                      {formatCurrency(orcamento.valor_total)}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleView(orcamento)}
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(orcamento)}
                        title={orcamento.status === 'aprovado' ? 'Alterar data de entrega' : 'Editar'}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {orcamento.status === 'pendente' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleConvert(orcamento)}
                          title="Converter em Pedido de Evento ou Cesta"
                          className="text-success hover:text-success"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(orcamento)}
                        className="text-destructive hover:text-destructive"
                        title="Excluir"
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
      <OrcamentoFormDialog
        open={formDialogOpen}
        onOpenChange={(open) => {
          setFormDialogOpen(open);
          if (!open) {
            setNewClienteId(null);
          }
        }}
        orcamento={selectedOrcamento}
        newClienteId={newClienteId}
      />

      {/* View Dialog */}
      <OrcamentoViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        orcamentoId={selectedOrcamento?.id}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o orçamento {selectedOrcamento?.numero_orcamento}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteOrcamento.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Convert Confirmation */}
      <AlertDialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Converter em Pedido de Evento ou Cesta</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja converter o orçamento {selectedOrcamento?.numero_orcamento} em um pedido de evento ou cesta? O orçamento será marcado como aprovado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmConvert}>
              {convertToPedido.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Converter
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}