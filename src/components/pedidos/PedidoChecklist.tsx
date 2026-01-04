import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckSquare, Square, Printer, Loader2 } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { Pedido, ItemPedido, ChecklistItem } from '@/types';
import { useChecklistItensByProdutos } from '@/hooks/useChecklist';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { ChecklistPDF } from './ChecklistPDF';

interface ChecklistItem2 {
  id: string;
  produtoNome: string;
  item: string;
  checked: boolean;
}

interface PedidoChecklistProps {
  pedido: Pedido;
  empresaNome?: string;
}

export function PedidoChecklist({ pedido, empresaNome = 'Experimente Pro' }: PedidoChecklistProps) {
  const [generatingPdf, setGeneratingPdf] = useState(false);
  
  // Get product IDs from pedido items
  const produtoIds = useMemo(() => {
    return pedido.itens?.map(item => item.produto_id) || [];
  }, [pedido.itens]);
  
  const { data: checklistItens, isLoading } = useChecklistItensByProdutos(produtoIds);
  
  // Build checklist with product names
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  
  const checklistData = useMemo(() => {
    if (!checklistItens || !pedido.itens) return [];
    
    const result: { produtoNome: string; produtoId: string; itens: ChecklistItem[] }[] = [];
    
    pedido.itens.forEach((pedidoItem) => {
      const produtoChecklist = checklistItens.filter(
        ci => ci.produto_id === pedidoItem.produto_id
      );
      
      if (produtoChecklist.length > 0) {
        result.push({
          produtoNome: pedidoItem.produto?.nome || 'Produto',
          produtoId: pedidoItem.produto_id,
          itens: produtoChecklist,
        });
      }
    });
    
    return result;
  }, [checklistItens, pedido.itens]);
  
  const toggleItem = (itemId: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };
  
  const totalItems = checklistData.reduce((acc, p) => acc + p.itens.length, 0);
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  
  const handlePrintChecklist = async () => {
    setGeneratingPdf(true);
    try {
      const blob = await pdf(
        <ChecklistPDF 
          pedido={pedido}
          checklistData={checklistData}
          checkedItems={checkedItems}
          empresaNome={empresaNome}
        />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `checklist-pedido-${format(new Date(pedido.data_hora_entrega), 'dd-MM-yyyy')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Checklist gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar checklist:', error);
      toast.error('Erro ao gerar checklist');
    } finally {
      setGeneratingPdf(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  if (checklistData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nenhum item de checklist disponível para este pedido.</p>
        <p className="text-sm">Os produtos deste pedido não possuem checklist configurado.</p>
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            Checklist de Produção
          </CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {checkedCount}/{totalItems} itens
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintChecklist}
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
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-6">
            {checklistData.map((produto, produtoIndex) => (
              <div key={produtoIndex} className="space-y-3">
                <h4 className="font-medium text-sm bg-muted/50 px-3 py-2 rounded-md">
                  {produto.produtoNome}
                </h4>
                <div className="space-y-2 pl-3">
                  {produto.itens.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 py-1"
                    >
                      <Checkbox
                        id={item.id}
                        checked={checkedItems[item.id] || false}
                        onCheckedChange={() => toggleItem(item.id)}
                      />
                      <label
                        htmlFor={item.id}
                        className={`text-sm cursor-pointer flex-1 ${
                          checkedItems[item.id] 
                            ? 'line-through text-muted-foreground' 
                            : ''
                        }`}
                      >
                        {item.item}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        {checkedCount === totalItems && totalItems > 0 && (
          <div className="mt-4 p-3 bg-success/20 text-success-foreground rounded-lg text-center text-sm font-medium">
            ✓ Todos os itens foram conferidos!
          </div>
        )}
      </CardContent>
    </Card>
  );
}