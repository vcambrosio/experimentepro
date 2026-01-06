import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, User, Package, FileText, Loader2, Download } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { useOrcamento } from '@/hooks/useOrcamentos';
import { useConfiguracaoEmpresa } from '@/hooks/useConfiguracaoEmpresa';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { OrcamentoPDF } from './OrcamentoPDF';
import { toast } from 'sonner';

interface OrcamentoViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orcamentoId?: string;
}

export function OrcamentoViewDialog({ open, onOpenChange, orcamentoId }: OrcamentoViewDialogProps) {
  const { isAdmin } = useAuth();
  const { data: orcamento, isLoading } = useOrcamento(orcamentoId || '');
  const { data: config } = useConfiguracaoEmpresa();
  const [generatingPdf, setGeneratingPdf] = useState(false);

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

  const handleDownloadPdf = async () => {
    if (!orcamento) return;
    
    setGeneratingPdf(true);
    try {
      console.log('=== INICIANDO GERAÇÃO DO PDF ===');
      console.log('Número do orçamento:', orcamento.numero_orcamento);
      console.log('Configuração da empresa:', config);
      console.log('Logo PDF URL:', config?.logo_pdf_url);
      console.log('Itens do orçamento:', orcamento.itens?.length);
      
      // Converte a URL do logo para base64 se existir
      let logoBase64: string | undefined = undefined;
      if (config?.logo_pdf_url) {
        try {
          console.log('Tentando converter logo para base64...');
          console.log('URL do logo:', config.logo_pdf_url);
          const response = await fetch(config.logo_pdf_url);
          console.log('Response status:', response.status);
          const blob = await response.blob();
          console.log('Blob type:', blob.type, 'size:', blob.size);
          logoBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          console.log('Logo convertido para base64 com sucesso, tamanho:', logoBase64.length);
          console.log('Primeiros 100 caracteres do base64:', logoBase64.substring(0, 100));
        } catch (logoError) {
          console.error('Erro ao converter logo para base64:', logoError);
          console.error('Detalhes do erro:', logoError instanceof Error ? logoError.message : String(logoError));
          // Continua sem o logo se houver erro na conversão
        }
      } else {
        console.log('Nenhuma URL de logo PDF configurada');
      }
      
      console.log('Passando logoBase64 para OrcamentoPDF:', logoBase64 ? logoBase64.substring(0, 50) + '...' : 'undefined');
      
      const blob = await pdf(
        <OrcamentoPDF
          orcamento={orcamento}
          empresaNome={config?.nome_empresa}
          empresaTelefone={config?.telefone}
          empresaEmail={config?.email}
          empresaEndereco={config?.endereco}
          empresaLogoUrl={logoBase64}
        />
      ).toBlob();
      
      console.log('PDF gerado com sucesso, tamanho:', blob.size);
      console.log('Tipo do blob:', blob.type);
      
      const url = URL.createObjectURL(blob);
      console.log('URL do blob criada:', url);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${orcamento.numero_orcamento}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('=== PDF BAIXADO COM SUCESSO ===');
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('=== ERRO AO GERAR PDF ===');
      console.error('Mensagem do erro:', error instanceof Error ? error.message : String(error));
      console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
      console.error('Nome do erro:', error instanceof Error ? error.name : String(error));
      console.error('Erro completo:', error);
      toast.error('Erro ao gerar PDF: ' + (error instanceof Error ? error.message : 'Erro desconhecido') + '. Tente novamente.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Orçamento {orcamento?.numero_orcamento}
            </DialogTitle>
            {orcamento && (
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
                    <Download className="h-4 w-4 mr-2" />
                    Baixar PDF
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
                      {orcamento.setor.responsavel && ` (${orcamento.setor.responsavel})`}
                      {orcamento.setor.contato && ` - ${orcamento.setor.contato}`}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Data e Hora de Entrega */}
            {(orcamento.data_entrega || orcamento.hora_entrega) && (
              <div className="flex items-start gap-3 p-4 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Data e Hora de Entrega</p>
                  <p className="font-medium">
                    {orcamento.data_entrega && format(new Date(orcamento.data_entrega + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    {orcamento.data_entrega && orcamento.hora_entrega && ' às '}
                    {orcamento.hora_entrega}
                  </p>
                </div>
              </div>
            )}

            {/* Descrição do Orçamento */}
            {orcamento.descricao && (
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium mb-2">Descrição</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {orcamento.descricao}
                </p>
              </div>
            )}

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