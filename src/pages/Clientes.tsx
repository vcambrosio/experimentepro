import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, User, Building2, Phone, Mail, ArrowUp, ArrowUpDown, ArrowDown, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useClientes, useDeleteCliente } from '@/hooks/useClientes';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Cliente } from '@/types';

type SortColumn = 'nome' | 'tipo' | 'contato' | 'status';
type SortDirection = 'asc' | 'desc';

export default function Clientes() {
  const navigate = useNavigate();
  const { setHeader } = usePageHeader();

  useEffect(() => {
    setHeader('Clientes', 'Gerencie seus clientes');
  }, [setHeader]);
  const { data: clientes, isLoading } = useClientes();
  const deleteCliente = useDeleteCliente();
  
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>('nome');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const filteredAndSortedClientes = useMemo(() => {
    if (!clientes) return [];

    // Primeiro aplica o filtro de busca
    let filtered = clientes.filter(cliente =>
      cliente.nome.toLowerCase().includes(search.toLowerCase()) ||
      cliente.contato?.toLowerCase().includes(search.toLowerCase()) ||
      cliente.email?.toLowerCase().includes(search.toLowerCase()) ||
      cliente.telefone?.includes(search)
    );

    // Depois aplica a ordenação
    return filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case 'nome':
          comparison = a.nome.localeCompare(b.nome);
          break;
        case 'tipo':
          comparison = a.tipo_pessoa.localeCompare(b.tipo_pessoa);
          break;
        case 'contato':
          const contatoA = a.contato || a.email || a.telefone || '';
          const contatoB = b.contato || b.email || b.telefone || '';
          comparison = contatoA.localeCompare(contatoB);
          break;
        case 'status':
          comparison = (a.ativo === b.ativo) ? 0 : a.ativo ? -1 : 1;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [clientes, search, sortColumn, sortDirection]);

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

  const handleDelete = async () => {
    if (deleteId) {
      await deleteCliente.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleExportXLSX = () => {
    if (!clientes || clientes.length === 0) {
      return;
    }

    // Prepara os dados para exportação
    const data = clientes.map((cliente) => ({
      'Nome': cliente.nome,
      'Tipo Pessoa': cliente.tipo_pessoa === 'juridica' ? 'Pessoa Jurídica' : 'Pessoa Física',
      'CPF/CNPJ': cliente.cpf_cnpj || '',
      'Contato': cliente.contato || '',
      'Telefone': cliente.telefone || '',
      'Email': cliente.email || '',
      'Status': cliente.ativo ? 'Ativo' : 'Inativo',
      'Setores': (cliente as any).setores_cliente?.map((s: any) => s.nome_setor).join('; ') || '',
    }));

    // Cria a planilha
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Ajusta a largura das colunas
    const colWidths = [
      { wch: 40 }, // Nome
      { wch: 20 }, // Tipo Pessoa
      { wch: 25 }, // CPF/CNPJ
      { wch: 30 }, // Contato
      { wch: 20 }, // Telefone
      { wch: 35 }, // Email
      { wch: 15 }, // Status
      { wch: 40 }, // Setores
    ];
    ws['!cols'] = colWidths;

    // Cria o workbook e adiciona a planilha
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');

    // Gera o nome do arquivo com data atual
    const fileName = `clientes_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Faz o download
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => navigate('/clientes/novo')}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
            <Button
              variant="outline"
              onClick={handleExportXLSX}
              disabled={!clientes || clientes.length === 0}
              title="Exportar todos os clientes para XLSX"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar XLSX
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort('nome')}
                  >
                    <div className="flex items-center">
                      Nome
                      {getSortIcon('nome')}
                    </div>
                  </TableHead>
                  <TableHead>Setores</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort('tipo')}
                  >
                    <div className="flex items-center">
                      Tipo
                      {getSortIcon('tipo')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort('contato')}
                  >
                    <div className="flex items-center">
                      Contato
                      {getSortIcon('contato')}
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
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedClientes?.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                          {cliente.tipo_pessoa === 'juridica' ? (
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <User className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{cliente.nome}</p>
                          {cliente.cpf_cnpj && (
                            <p className="text-sm text-muted-foreground">
                              {cliente.tipo_pessoa === 'juridica' ? 'CNPJ: ' : 'CPF: '}
                              {cliente.cpf_cnpj}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(cliente as any).setores_cliente && (cliente as any).setores_cliente.length > 0 ? (
                          (cliente as any).setores_cliente.map((setor: any, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {setor.nome_setor || `Setor ${index + 1}`}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          cliente.tipo_pessoa === 'juridica'
                            ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                        }
                      >
                        {cliente.tipo_pessoa === 'juridica' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {cliente.contato && (
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <User className="h-3 w-3 text-primary" />
                            {cliente.contato}
                          </div>
                        )}
                        {cliente.telefone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {cliente.telefone}
                          </div>
                        )}
                        {cliente.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {cliente.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={cliente.ativo ? 'default' : 'secondary'}>
                        {cliente.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/clientes/${cliente.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(cliente.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAndSortedClientes?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum cliente encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O cliente será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}