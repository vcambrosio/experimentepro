import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Search, Eye, Edit, Trash2, Loader2, Filter, FileText, ArrowRight, CheckCircle, XCircle, Clock, X } from 'lucide-react';
import { useOrcamentos, useDeleteOrcamento, useUpdateOrcamento, useConvertOrcamentoToPedido } from '@/hooks/useOrcamentos';
import { useAuth } from '@/contexts/AuthContext';
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

export default function Orcamentos() {
  const { isAdmin } = useAuth();
  const { data: orcamentos, isLoading, error } = useOrcamentos();
  const deleteOrcamento = useDeleteOrcamento();
  const updateOrcamento = useUpdateOrcamento();
  const convertToPedido = useConvertOrcamentoToPedido();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
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

  const filteredOrcamentos = orcamentos?.filter(orcamento => {
    const matchesSearch = 
      orcamento.cliente?.nome?.toLowerCase().includes(search.toLowerCase()) ||
      orcamento.numero_orcamento?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || orcamento.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Orçamentos</h1>
          <p className="text-muted-foreground">Gerencie seus orçamentos e propostas</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
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
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredOrcamentos?.length === 0 ? (
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
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Entrega</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead className="text-right">Valor</TableHead>}
                <TableHead className="w-[140px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrcamentos?.map((orcamento) => (
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
                      {orcamento.validade && (
                        <p className="text-sm text-muted-foreground">
                          Válido até: {format(new Date(orcamento.validade), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {orcamento.data_entrega && (
                      <div>
                        <p className="font-medium">
                          {format(new Date(orcamento.data_entrega), 'dd/MM/yyyy', { locale: ptBR })}
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
                        title="Editar"
                        disabled={orcamento.status === 'aprovado'}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {orcamento.status === 'pendente' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleConvert(orcamento)}
                          title="Converter em Pedido"
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
            <AlertDialogTitle>Converter em Pedido</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja converter o orçamento {selectedOrcamento?.numero_orcamento} em um pedido? O orçamento será marcado como aprovado.
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