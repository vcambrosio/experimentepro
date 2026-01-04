import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, User, Package, Loader2, Clock, DollarSign, Download, Printer } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { usePedido } from '@/hooks/usePedidos';
import { useConfiguracaoEmpresa } from '@/hooks/useConfiguracaoEmpresa';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { PedidoPDF } from './PedidoPDF';
import { PedidoChecklist } from './PedidoChecklist';
import { toast } from 'sonner';

interface PedidoViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedidoId?: string;
}

export function PedidoViewDialog({ open, onOpenChange, pedidoId }: PedidoViewDialogProps) {
  const { isAdmin } = useAuth();
  const { data: pedido, isLoading } = usePedido(pedidoId || '');
  const { data: config } = useConfiguracaoEmpresa();
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState('detalhes');

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
      case 'executado':
        return 'bg-success text-success-foreground';
      case 'cancelado':
        return 'bg-destructive text-destructive-foreground';
      case 'pago':
        return 'bg-success text-success-foreground';
      default:
        return '';
    }
  };

  const handleDownloadPdf = async () => {
    if (!pedido) return;
    
    setGeneratingPdf(true);
    try {
      const blob = await pdf(
        <PedidoPDF 
          pedido={pedido}
          empresaNome={config?.nome_empresa}
          showValues={isAdmin}
        />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pedido-${format(new Date(pedido.data_hora_entrega), 'dd-MM-yyyy-HHmm')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Detalhes do Pedido</DialogTitle>
            {pedido && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDownloadPdf}
                disabled={generatingPdf}
              >
                {generatingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !pedido ? (
          <div className="text-center py-12 text-muted-foreground">
            Pedido não encontrado
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
              <TabsTrigger value="checklist">Checklist</TabsTrigger>
            </TabsList>

            <TabsContent value="detalhes" className="space-y-6 mt-4">
              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Entrega</p>
                    <p className="font-medium">
                      {format(new Date(pedido.data_hora_entrega), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      às {format(new Date(pedido.data_hora_entrega), 'HH:mm')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <User className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{pedido.cliente?.nome}</p>
                    {pedido.setor && (
                      <p className="text-sm text-muted-foreground">
                        {pedido.setor.nome_setor}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge className={getStatusBadgeClass(pedido.status)}>
                    {pedido.status === 'pendente' ? 'Pendente' : 
                     pedido.status === 'executado' ? 'Executado' : 'Cancelado'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Pagamento:</span>
                  <Badge className={getStatusBadgeClass(pedido.status_pagamento)}>
                    {pedido.status_pagamento === 'pendente' ? 'A Pagar' : 'Pago'}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Itens */}
              <div>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Itens do Pedido
                </h3>
                
                {pedido.itens && pedido.itens.length > 0 ? (
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
                        {pedido.itens.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.produto?.nome}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.categoria?.nome}
                                </p>
                                {item.descricao_customizada && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {item.descricao_customizada}
                                  </p>
                                )}
                                {item.detalhes && (
                                  <p className="text-xs text-muted-foreground mt-1 italic">
                                    Obs: {item.detalhes}
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
                      <p className="text-sm text-muted-foreground">Total do Pedido</p>
                      <p className="text-2xl font-semibold text-primary">
                        {formatCurrency(pedido.valor_total)}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Timestamps */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Criado em: {format(new Date(pedido.created_at), "dd/MM/yyyy 'às' HH:mm")}</p>
                {pedido.executed_at && (
                  <p>Executado em: {format(new Date(pedido.executed_at), "dd/MM/yyyy 'às' HH:mm")}</p>
                )}
                {pedido.paid_at && (
                  <p>Pago em: {format(new Date(pedido.paid_at), "dd/MM/yyyy 'às' HH:mm")}</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="checklist" className="mt-4">
              <PedidoChecklist 
                pedido={pedido} 
                empresaNome={config?.nome_empresa}
              />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}