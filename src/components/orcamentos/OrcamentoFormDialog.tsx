import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { CalendarIcon, Plus, Trash2, Loader2, UserPlus, Pencil } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useClientes, useSetoresCliente } from '@/hooks/useClientes';
import { useProdutos } from '@/hooks/useProdutos';
import { useCreateOrcamento, useUpdateOrcamento, useOrcamento } from '@/hooks/useOrcamentos';
import { Orcamento } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { useNavigate } from 'react-router-dom';

interface ItemForm {
  produto_id: string;
  categoria_id: string;
  descricao_customizada: string;
  quantidade: number;
  valor_unitario: number;
  observacoes: string;
}

interface OrcamentoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orcamento: Orcamento | null;
  newClienteId?: string | null;
}

export function OrcamentoFormDialog({ open, onOpenChange, orcamento, newClienteId }: OrcamentoFormDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: clientes } = useClientes();
  const { data: produtos } = useProdutos();
  const createOrcamento = useCreateOrcamento();
  const updateOrcamento = useUpdateOrcamento();
  
  const [clienteId, setClienteId] = useState('');
  const [setorId, setSetorId] = useState('');
  const [dataOrcamento, setDataOrcamento] = useState<Date>(new Date());
  const [validade, setValidade] = useState<Date | undefined>(addDays(new Date(), 30));
  const [dataEntrega, setDataEntrega] = useState<Date | undefined>(undefined);
  const [horaEntrega, setHoraEntrega] = useState('');
  const [descricao, setDescricao] = useState('');
  const [condicoesComerciais, setCondicoesComerciais] = useState('');
  const [itens, setItens] = useState<ItemForm[]>([]);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState<ItemForm>({
    produto_id: '',
    categoria_id: '',
    descricao_customizada: '',
    quantidade: 1,
    valor_unitario: 0,
    observacoes: '',
  });
  
  const { data: setores } = useSetoresCliente(clienteId);
  const { data: orcamentoCompleto } = useOrcamento(orcamento?.id || '');

  const isEditing = !!orcamento;

  // Generate numero_orcamento
  const generateNumeroOrcamento = () => {
    const now = new Date();
    return `ORC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (open) {
      if (orcamento && orcamentoCompleto) {
        setClienteId(orcamento.cliente_id);
        setSetorId(orcamento.setor_id || '');
        setDataOrcamento(new Date(orcamento.data_orcamento));
        setValidade(orcamento.validade ? new Date(orcamento.validade) : undefined);
        setDataEntrega(orcamento.data_entrega ? new Date(orcamento.data_entrega) : undefined);
        setHoraEntrega(orcamento.hora_entrega || '');
        setDescricao(orcamento.descricao || '');
        setCondicoesComerciais(orcamento.condicoes_comerciais || '');
        
        if (orcamentoCompleto.itens) {
          setItens(orcamentoCompleto.itens.map(item => ({
            produto_id: item.produto_id,
            categoria_id: item.categoria_id,
            descricao_customizada: item.descricao_customizada || '',
            quantidade: item.quantidade,
            valor_unitario: item.valor_unitario,
            observacoes: item.observacoes || '',
          })));
        }
      } else {
        resetForm();
      }
    }
  }, [open, orcamento, orcamentoCompleto]);

  // Seleciona automaticamente o novo cliente quando newClienteId é fornecido
  useEffect(() => {
    if (newClienteId) {
      setClienteId(newClienteId);
    }
  }, [newClienteId]);

  const resetForm = () => {
    setClienteId('');
    setSetorId('');
    setDataOrcamento(new Date());
    setValidade(addDays(new Date(), 30));
    setDataEntrega(undefined);
    setHoraEntrega('');
    setDescricao('');
    setCondicoesComerciais('');
    setItens([]);
    setEditingItemIndex(null);
    setShowAddForm(false);
    setNewItem({
      produto_id: '',
      categoria_id: '',
      descricao_customizada: '',
      quantidade: 1,
      valor_unitario: 0,
      observacoes: '',
    });
  };

  const handleCreateCliente = () => {
    // Salva o estado atual do formulário de orçamento no localStorage
    const orcamentoState = {
      clienteId,
      setorId,
      dataOrcamento: dataOrcamento.toISOString(),
      validade: validade?.toISOString(),
      dataEntrega: dataEntrega?.toISOString(),
      horaEntrega,
      descricao,
      condicoesComerciais,
      itens,
    };
    localStorage.setItem('orcamentoFormState', JSON.stringify(orcamentoState));
    
    // Navega para a página de criação de cliente com parâmetro de retorno
    navigate('/clientes/novo?returnTo=orcamento');
  };

  // Carrega o estado salvo ao abrir o diálogo
  useEffect(() => {
    if (open && !isEditing) {
      const savedState = localStorage.getItem('orcamentoFormState');
      if (savedState) {
        try {
          const state = JSON.parse(savedState);
          if (state.clienteId) setClienteId(state.clienteId);
          if (state.setorId) setSetorId(state.setorId);
          if (state.dataOrcamento) setDataOrcamento(new Date(state.dataOrcamento));
          if (state.validade) setValidade(new Date(state.validade));
          if (state.dataEntrega) setDataEntrega(new Date(state.dataEntrega));
          if (state.horaEntrega) setHoraEntrega(state.horaEntrega);
          if (state.descricao) setDescricao(state.descricao);
          if (state.condicoesComerciais) setCondicoesComerciais(state.condicoesComerciais);
          if (state.itens) setItens(state.itens);
          
          // Limpa o estado salvo após carregar
          localStorage.removeItem('orcamentoFormState');
        } catch (error) {
          console.error('Erro ao carregar estado do orçamento:', error);
        }
      }
    }
  }, [open, isEditing]);

  const handleAddItem = () => {
    setEditingItemIndex(null);
    setShowAddForm(true);
    setNewItem({
      produto_id: '',
      categoria_id: '',
      descricao_customizada: '',
      quantidade: 1,
      valor_unitario: 0,
      observacoes: '',
    });
  };

  const handleSaveItem = () => {
    if (!newItem.produto_id) {
      alert('Por favor, selecione um produto.');
      return;
    }

    if (editingItemIndex !== null) {
      // Editando item existente
      const updatedItens = [...itens];
      updatedItens[editingItemIndex] = newItem;
      setItens(updatedItens);
    } else {
      // Adicionando novo item
      setItens([...itens, newItem]);
    }

    // Limpa o formulário
    setNewItem({
      produto_id: '',
      categoria_id: '',
      descricao_customizada: '',
      quantidade: 1,
      valor_unitario: 0,
      observacoes: '',
    });
    setEditingItemIndex(null);
    setShowAddForm(false);
  };

  const handleEditItem = (index: number) => {
    setEditingItemIndex(index);
    setShowAddForm(false);
    setNewItem({ ...itens[index] });
  };

  const handleRemoveItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleCancelEdit = () => {
    setEditingItemIndex(null);
    setShowAddForm(false);
    setNewItem({
      produto_id: '',
      categoria_id: '',
      descricao_customizada: '',
      quantidade: 1,
      valor_unitario: 0,
      observacoes: '',
    });
  };

  const updateNewItem = (field: keyof ItemForm, value: string | number) => {
    const updated = { ...newItem, [field]: value };
    
    if (field === 'produto_id') {
      const produto = produtos?.find(p => p.id === value);
      if (produto) {
        updated.categoria_id = produto.categoria_id;
        updated.valor_unitario = produto.valor_venda;
        updated.descricao_customizada = produto.descricao_padrao || '';
      }
    }
    
    setNewItem(updated);
  };

  const calcularTotal = (itensList: ItemForm[] = itens) => {
    return itensList.reduce((acc, item) => acc + (item.quantidade * item.valor_unitario), 0);
  };

  const handleSubmit = async () => {
    if (!clienteId || itens.length === 0) return;

    const orcamentoData = {
      numero_orcamento: orcamento?.numero_orcamento || generateNumeroOrcamento(),
      data_orcamento: dataOrcamento.toISOString().split('T')[0],
      cliente_id: clienteId,
      setor_id: setorId || null,
      descricao: descricao || null,
      condicoes_comerciais: condicoesComerciais || null,
      valor_total: calcularTotal(itens),
      status: 'pendente' as const,
      validade: validade ? validade.toISOString().split('T')[0] : null,
      data_entrega: dataEntrega ? dataEntrega.toISOString().split('T')[0] : null,
      hora_entrega: horaEntrega || null,
      created_by: user?.id || '',
    };

    const itensData = itens.map(item => ({
      produto_id: item.produto_id,
      categoria_id: item.categoria_id,
      descricao_customizada: item.descricao_customizada || null,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
      valor_total: item.quantidade * item.valor_unitario,
      observacoes: item.observacoes || null,
    }));

    if (isEditing && orcamento) {
      await updateOrcamento.mutateAsync({
        id: orcamento.id,
        ...orcamentoData,
        itens: itensData as any,
      });
    } else {
      await createOrcamento.mutateAsync({
        orcamento: orcamentoData,
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

  const isSubmitting = createOrcamento.isPending || updateOrcamento.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Orçamento' : 'Novo Orçamento'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Altere os dados do orçamento' : 'Preencha os dados para criar um novo orçamento'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Cliente e Setor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente *</Label>
              <div className="flex gap-2">
                <div className="flex-1">
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
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCreateCliente}
                  title="Criar novo cliente"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
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

          {/* Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data do Orçamento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dataOrcamento, 'PPP', { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataOrcamento}
                    onSelect={(date) => date && setDataOrcamento(date)}
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Validade</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !validade && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {validade ? format(validade, 'PPP', { locale: ptBR }) : 'Selecione a validade'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={validade}
                    onSelect={setValidade}
                    locale={ptBR}
                    disabled={(date) => date < new Date()}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Data e Hora de Entrega */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Entrega (opcional)</Label>
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
                    {dataEntrega ? format(dataEntrega, 'PPP', { locale: ptBR }) : 'Selecione a data de entrega'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataEntrega}
                    onSelect={setDataEntrega}
                    locale={ptBR}
                    disabled={(date) => date < new Date()}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Hora de Entrega (opcional)</Label>
              <Input
                type="time"
                value={horaEntrega}
                onChange={(e) => setHoraEntrega(e.target.value)}
                placeholder="Selecione a hora"
              />
            </div>
          </div>

          {/* Descrição do Orçamento */}
          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Textarea
              placeholder="Descrição geral do orçamento..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
            />
          </div>

          {/* Condições Comerciais */}
          <div className="space-y-2">
            <Label>Condições Comerciais</Label>
            <Textarea
              placeholder="Condições de pagamento, prazos, observações gerais..."
              value={condicoesComerciais}
              onChange={(e) => setCondicoesComerciais(e.target.value)}
              rows={3}
            />
          </div>

          {/* Itens */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Itens do Orçamento</Label>
              {itens.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="bg-muted/50 hover:bg-muted/70"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Item
                </Button>
              )}
            </div>

            {/* Formulário de Adição/Edição de Item */}
            {(editingItemIndex !== null || showAddForm || itens.length === 0) && (
              <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Produto *</Label>
                    <Select
                      value={newItem.produto_id}
                      onValueChange={(value) => updateNewItem('produto_id', value)}
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
                        value={newItem.quantidade}
                        onChange={(e) => updateNewItem('quantidade', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Valor Unit.</Label>
                      <Input
                        type="text"
                        step="0.01"
                        min="0"
                        value={formatCurrency(newItem.valor_unitario)}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d,.-]/g, '');
                          const numValue = parseFloat(value.replace(',', '.')) || 0;
                          updateNewItem('valor_unitario', numValue);
                        }}
                        placeholder="R$ 0,00"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descrição / Observações</Label>
                  <Input
                    placeholder="Descrição customizada ou observações do item"
                    value={newItem.descricao_customizada}
                    onChange={(e) => updateNewItem('descricao_customizada', e.target.value)}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  {editingItemIndex !== null && (
                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                      Cancelar
                    </Button>
                  )}
                  <Button type="button" onClick={handleSaveItem}>
                    {editingItemIndex !== null ? 'Salvar Alterações' : 'Adicionar Item'}
                  </Button>
                </div>
              </div>
            )}

            {/* Lista de Itens Adicionados */}
            {itens.length > 0 && (
              <ScrollArea className="h-[250px] pr-4">
                <div className="space-y-2">
                  {itens.map((item, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">Item {index + 1}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground truncate">
                              {produtos?.find(p => p.id === item.produto_id)?.nome || 'Produto não encontrado'}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <div className="text-sm text-muted-foreground">
                              {item.quantidade}x {formatCurrency(item.valor_unitario)}
                              {item.descricao_customizada && (
                                <span className="ml-2 text-xs italic">• {item.descricao_customizada}</span>
                              )}
                            </div>
                            <div className="text-sm font-medium text-primary">
                              Subtotal: {formatCurrency(item.quantidade * item.valor_unitario)}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditItem(index)}
                            className="h-8 w-8"
                            title="Editar item"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(index)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title="Remover item"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Total */}
            {itens.length > 0 && (
              <div className="flex justify-end p-4 bg-muted rounded-lg">
                <div className="text-right">
                  <span className="text-muted-foreground">Total do Orçamento: </span>
                  <span className="text-xl font-semibold text-primary">{formatCurrency(calcularTotal(itens))}</span>
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
            disabled={isSubmitting || !clienteId || itens.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              isEditing ? 'Salvar Alterações' : 'Criar Orçamento'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
