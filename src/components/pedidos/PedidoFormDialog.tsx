import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useClientes, useSetoresCliente } from '@/hooks/useClientes';
import { useProdutos } from '@/hooks/useProdutos';
import { useCreatePedido, useUpdatePedido, usePedido } from '@/hooks/usePedidos';
import { Pedido, ItemPedido } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';

interface ItemForm {
  produto_id: string;
  categoria_id: string;
  descricao_customizada: string;
  quantidade: number;
  valor_unitario: number;
  detalhes: string;
}

interface PedidoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedido: Pedido | null;
  initialDate?: Date;
}

export function PedidoFormDialog({ open, onOpenChange, pedido, initialDate }: PedidoFormDialogProps) {
  const { user } = useAuth();
  const { data: clientes } = useClientes();
  const { data: produtos } = useProdutos();
  const createPedido = useCreatePedido();
  const updatePedido = useUpdatePedido();
  
  const [clienteId, setClienteId] = useState('');
  const [setorId, setSetorId] = useState('');
  const [dataEntrega, setDataEntrega] = useState<Date | undefined>();
  const [horaEntrega, setHoraEntrega] = useState('12:00');
  const [itens, setItens] = useState<ItemForm[]>([]);
  
  const { data: setores } = useSetoresCliente(clienteId);
  const { data: pedidoCompleto } = usePedido(pedido?.id || '');

  const isEditing = !!pedido;

  useEffect(() => {
    if (open) {
      if (pedido && pedidoCompleto) {
        setClienteId(pedido.cliente_id);
        setSetorId(pedido.setor_id || '');
        const entregaDate = new Date(pedido.data_hora_entrega);
        setDataEntrega(entregaDate);
        setHoraEntrega(format(entregaDate, 'HH:mm'));
        
        if (pedidoCompleto.itens) {
          setItens(pedidoCompleto.itens.map(item => ({
            produto_id: item.produto_id,
            categoria_id: item.categoria_id,
            descricao_customizada: item.descricao_customizada || '',
            quantidade: item.quantidade,
            valor_unitario: item.valor_unitario,
            detalhes: item.detalhes || '',
          })));
        }
      } else {
        resetForm();
      }
    }
  }, [open, pedido, pedidoCompleto]);

  const resetForm = () => {
    setClienteId('');
    setSetorId('');
    setDataEntrega(initialDate || undefined);
    setHoraEntrega('12:00');
    setItens([]);
  };

  const addItem = () => {
    setItens([...itens, {
      produto_id: '',
      categoria_id: '',
      descricao_customizada: '',
      quantidade: 1,
      valor_unitario: 0,
      detalhes: '',
    }]);
  };

  const removeItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ItemForm, value: string | number) => {
    const newItens = [...itens];
    newItens[index] = { ...newItens[index], [field]: value };
    
    // Auto-fill categoria and valor when produto is selected
    if (field === 'produto_id') {
      const produto = produtos?.find(p => p.id === value);
      if (produto) {
        newItens[index].categoria_id = produto.categoria_id;
        newItens[index].valor_unitario = produto.valor_venda;
        newItens[index].descricao_customizada = produto.descricao_padrao || '';
      }
    }
    
    setItens(newItens);
  };

  const calcularTotal = () => {
    return itens.reduce((acc, item) => acc + (item.quantidade * item.valor_unitario), 0);
  };

  const handleSubmit = async () => {
    if (!clienteId || !dataEntrega || itens.length === 0) return;

    const [hours, minutes] = horaEntrega.split(':').map(Number);
    const dataHoraEntrega = new Date(dataEntrega);
    dataHoraEntrega.setHours(hours, minutes, 0, 0);

    const pedidoData = {
      cliente_id: clienteId,
      setor_id: setorId || null,
      data_hora_entrega: dataHoraEntrega.toISOString(),
      status: 'pendente' as const,
      status_pagamento: 'pendente' as const,
      valor_total: calcularTotal(),
      created_by: user?.id || '',
    };

    const itensData = itens.map(item => ({
      produto_id: item.produto_id,
      categoria_id: item.categoria_id,
      descricao_customizada: item.descricao_customizada || null,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
      valor_total: item.quantidade * item.valor_unitario,
      detalhes: item.detalhes || null,
    }));

    if (isEditing && pedido) {
      await updatePedido.mutateAsync({
        id: pedido.id,
        ...pedidoData,
      });
    } else {
      await createPedido.mutateAsync({
        pedido: pedidoData,
        itens: itensData,
      });
    }

    onOpenChange(false);
    resetForm();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const isSubmitting = createPedido.isPending || updatePedido.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Pedido' : 'Novo Pedido'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Altere os dados do pedido' : 'Preencha os dados para criar um novo pedido'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Cliente e Setor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente *</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes?.filter(c => c.ativo).map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="setor">Setor</Label>
              <Select value={setorId} onValueChange={setSetorId} disabled={!clienteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o setor (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {setores?.map((setor) => (
                    <SelectItem key={setor.id} value={setor.id}>
                      {setor.nome_setor} {setor.responsavel && `- ${setor.responsavel}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Data e Hora de Entrega */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Entrega *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataEntrega && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataEntrega ? format(dataEntrega, 'PPP', { locale: ptBR }) : 'Selecione a data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataEntrega}
                    onSelect={setDataEntrega}
                    locale={ptBR}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hora">Hora de Entrega *</Label>
              <Input
                id="hora"
                type="time"
                value={horaEntrega}
                onChange={(e) => setHoraEntrega(e.target.value)}
              />
            </div>
          </div>

          {/* Itens */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Itens do Pedido</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Item
              </Button>
            </div>

            {itens.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">Nenhum item adicionado</p>
                <Button type="button" variant="link" onClick={addItem}>
                  Adicionar primeiro item
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {itens.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-muted-foreground">Item {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Produto *</Label>
                        <Select
                          value={item.produto_id}
                          onValueChange={(value) => updateItem(index, 'produto_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o produto" />
                          </SelectTrigger>
                          <SelectContent>
                            {produtos?.filter(p => p.ativo).map((produto) => (
                              <SelectItem key={produto.id} value={produto.id}>
                                {produto.nome} - {formatCurrency(produto.valor_venda)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Quantidade *</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantidade}
                            onChange={(e) => updateItem(index, 'quantidade', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Valor Unit.</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.valor_unitario}
                            onChange={(e) => updateItem(index, 'valor_unitario', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Descrição / Observações</Label>
                      <Textarea
                        placeholder="Descrição customizada ou observações do item"
                        value={item.descricao_customizada}
                        onChange={(e) => updateItem(index, 'descricao_customizada', e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div className="text-right text-sm">
                      <span className="text-muted-foreground">Subtotal: </span>
                      <span className="font-medium">{formatCurrency(item.quantidade * item.valor_unitario)}</span>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end p-4 bg-muted rounded-lg">
                  <div className="text-right">
                    <span className="text-muted-foreground">Total do Pedido: </span>
                    <span className="text-xl font-semibold text-primary">{formatCurrency(calcularTotal())}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !clienteId || !dataEntrega || itens.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              isEditing ? 'Salvar Alterações' : 'Criar Pedido'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}