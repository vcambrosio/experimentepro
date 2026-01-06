import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, FolderOpen, ArrowUp, ArrowUpDown, ArrowDown, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useCategorias, useDeleteCategoria } from '@/hooks/useCategorias';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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

type SortColumn = 'nome' | 'status' | 'criada';
type SortDirection = 'asc' | 'desc';

export default function Categorias() {
  const navigate = useNavigate();
  const { setHeader } = usePageHeader();

  useEffect(() => {
    setHeader('Categorias', 'Gerencie as categorias de produtos');
  }, [setHeader]);
  const { data: categorias, isLoading } = useCategorias();
  const deleteCategoria = useDeleteCategoria();
  
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>('nome');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const filteredAndSortedCategorias = useMemo(() => {
    if (!categorias) return [];

    // Primeiro aplica o filtro de busca
    let filtered = categorias.filter(categoria =>
      categoria.nome.toLowerCase().includes(search.toLowerCase())
    );

    // Depois aplica a ordenação
    return filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case 'nome':
          comparison = a.nome.localeCompare(b.nome);
          break;
        case 'status':
          comparison = (a.ativo === b.ativo) ? 0 : a.ativo ? -1 : 1;
          break;
        case 'criada':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [categorias, search, sortColumn, sortDirection]);

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
      await deleteCategoria.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleExportXLSX = () => {
    if (!categorias || categorias.length === 0) {
      return;
    }

    // Prepara os dados para exportação
    const data = categorias.map((categoria) => ({
      'Nome': categoria.nome,
      'Status': categoria.ativo ? 'Ativa' : 'Inativa',
      'Criada em': new Date(categoria.created_at).toLocaleDateString('pt-BR'),
    }));

    // Cria a planilha
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Ajusta a largura das colunas
    const colWidths = [
      { wch: 40 }, // Nome
      { wch: 15 }, // Status
      { wch: 20 }, // Criada em
    ];
    ws['!cols'] = colWidths;

    // Cria o workbook e adiciona a planilha
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Categorias');

    // Gera o nome do arquivo com data atual
    const fileName = `categorias_${new Date().toISOString().split('T')[0]}.xlsx`;

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
                placeholder="Buscar categorias..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => navigate('/categorias/novo')}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Categoria
            </Button>
            <Button
              variant="outline"
              onClick={handleExportXLSX}
              disabled={!categorias || categorias.length === 0}
              title="Exportar todas as categorias para XLSX"
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
                    onClick={() => handleSort('criada')}
                  >
                    <div className="flex items-center">
                      Criada em
                      {getSortIcon('criada')}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedCategorias?.map((categoria) => (
                  <TableRow key={categoria.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                          <FolderOpen className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <span className="font-medium">{categoria.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={categoria.ativo ? 'default' : 'secondary'}>
                        {categoria.ativo ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(categoria.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/categorias/${categoria.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(categoria.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAndSortedCategorias?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhuma categoria encontrada
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
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Certifique-se de que não há produtos vinculados a esta categoria.
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