import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, User, Package, FileText, Loader2 } from 'lucide-react';
import { useOrcamento } from '@/hooks/useOrcamentos';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

interface OrcamentoViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orcamentoId?: string;
}

export function OrcamentoViewDialog({ open, onOpenChange, orcamentoId }: OrcamentoViewDialogProps) {
  const { isAdmin } = useAuth();
  const { data: orcamento, isLoading } = useOrcamento(orcamentoId || '');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-warning text-warning-foreground';
      case 'aprovado':
        return 'bg-success text-success-foreground';
      case 'recusado':
        return 'bg-destructive text-destructive-foreground';
      case 'expirado':
        return 'bg-muted text-muted-foreground';
      default:
        return '';
    }
  };

  const statusLabels: Record<string, string> = {
    pendente: 'Pendente',
    aprovado: 'Aprovado',
    recusado: 'Recusado',
    expirado: 'Expirado',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Orçamento {orcamento?.numero_orcamento}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !orcamento ? (
          <div className="text-center py-12 text-muted-foreground">
            Orçamento não encontrado
          </div>
        ) : (
          <div className="space-y-6">
            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Data do Orçamento</p>
                  <p className="font-medium">
                    {format(new Date(orcamento.data_orcamento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  {orcamento.validade && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Válido até: {format(new Date(orcamento.validade), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <User className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{orcamento.cliente?.nome}</p>
                  {orcamento.setor && (
                    <p className="text-sm text-muted-foreground">
                      {orcamento.setor.nome_setor}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge className={getStatusBadgeClass(orcamento.status)}>
                {statusLabels[orcamento.status]}
              </Badge>
            </div>

            {/* Condições Comerciais */}
            {orcamento.condicoes_comerciais && (
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium mb-2">Condições Comerciais</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {orcamento.condicoes_comerciais}
                </p>
              </div>
            )}

            <Separator />

            {/* Itens */}
            <div>
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Itens do Orçamento
              </h3>
              
              {orcamento.itens && orcamento.itens.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-center">Qtd</TableHead>
                        {isAdmin && <TableHead className="text-right">Unit.</TableHead>}
                        {isAdmin && <TableHead className="text-right">Total</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orcamento.itens.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.produto?.nome}</p>
                              {item.descricao_customizada && (
                                <p className="text-sm text-muted-foreground">
                                  {item.descricao_customizada}
                                </p>
                              )}
                              {item.observacoes && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {item.observacoes}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{item.quantidade}</TableCell>
                          {isAdmin && (
                            <TableCell className="text-right">
                              {formatCurrency(item.valor_unitario)}
                            </TableCell>
                          )}
                          {isAdmin && (
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.valor_total)}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum item encontrado
                </p>
              )}
            </div>

            {/* Total */}
            {isAdmin && (
              <>
                <Separator />
                <div className="flex justify-end">
                  <div className="text-right p-4 bg-primary/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total do Orçamento</p>
                    <p className="text-2xl font-semibold text-primary">
                      {formatCurrency(orcamento.valor_total)}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Timestamps */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Criado em: {format(new Date(orcamento.created_at), "dd/MM/yyyy 'às' HH:mm")}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}