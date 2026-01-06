import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, UserPlus, Pencil } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useClientes, useCreateCliente } from '@/hooks/useClientes';
import { useProdutos } from '@/hooks/useProdutos';
import { useCreatePedido, useUpdatePedido, usePedido, usePedidos } from '@/hooks/usePedidos';
import { Pedido, ItemPedido } from '@/types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
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

interface ItemForm {
  produto_id: string;
  categoria_id: string;
  descricao_customizada: string;
  quantidade: number;
  valor_unitario: number;
  detalhes: string;
}

interface VendaLojaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedido: Pedido | null;
  newClienteId?: string | null;
}

export function VendaLojaFormDialog({ open, onOpenChange, pedido, newClienteId }: VendaLojaFormDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const { data: clientes } = useClientes();
  const { data: produtos } = useProdutos();
  const createPedido = useCreatePedido();
  const updatePedido = useUpdatePedido();
  const createCliente = useCreateCliente();
  const queryClient = useQueryClient();
  
  const [clienteId, setClienteId] = useState('');
  const [emiteNotaFiscal, setEmiteNotaFiscal] = useState(false);
  const [itens, setItens] = useState<ItemForm[]>([]);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState<ItemForm>({
    produto_id: '',
    categoria_id: '',
    descricao_customizada: '',
    quantidade: 1,
    valor_unitario: 0,
    detalhes: '',
  });
  const [novoClienteDialog, setNovoClienteDialog] = useState(false);
  const [novoClienteNome, setNovoClienteNome] = useState('');
  const [novoClienteTipoPessoa, setNovoClienteTipoPessoa] = useState<'fisica' | 'juridica'>('fisica');
  const [novoClienteCpfCnpj, setNovoClienteCpfCnpj] = useState('');
  const [novoClienteTelefone, setNovoClienteTelefone] = useState('');
  const [novoClienteEmail, setNovoClienteEmail] = useState('');
  const [novoClienteEndereco, setNovoClienteEndereco] = useState('');
  const [novoClienteContato, setNovoClienteContato] = useState('');
  const [criandoCliente, setCriandoCliente] = useState(false);
  
  const { data: pedidoCompleto } = usePedido(pedido?.id || '');
  
  const isEditing = !!pedido;
  
  useEffect(() => {
    if (open) {
      if (pedido && pedidoCompleto) {
        setClienteId(pedido.cliente_id);
        setEmiteNotaFiscal(pedido.emite_nota_fiscal || false);
        
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
  
  const handleCreateCliente = () => {
    // Salva o estado atual do formulário de venda no localStorage
    const vendaState = {
      clienteId,
      emiteNotaFiscal,
      itens,
    };
    localStorage.setItem('vendaLojaFormState', JSON.stringify(vendaState));
    
    // Navega para a página de criação de cliente com parâmetro de retorno
    navigate('/clientes/novo?returnTo=venda-loja');
  };
  
  // Carrega o estado salvo ao abrir o diálogo
  useEffect(() => {
    if (open && !isEditing) {
      const savedState = localStorage.getItem('vendaLojaFormState');
      if (savedState) {
        try {
          const state = JSON.parse(savedState);
          if (state.clienteId) setClienteId(state.clienteId);
          if (state.emiteNotaFiscal !== undefined) setEmiteNotaFiscal(state.emiteNotaFiscal);
          if (state.itens) setItens(state.itens);
          
          // Limpa o estado salvo após carregar
          localStorage.removeItem('vendaLojaFormState');
        } catch (error) {
          console.error('Erro ao carregar estado da venda:', error);
        }
      }
    }
  }, [open, isEditing]);

  // Seleciona automaticamente o novo cliente quando newClienteId é fornecido
  useEffect(() => {
    if (newClienteId) {
      setClienteId(newClienteId);
    }
  }, [newClienteId]);
  
  const handleCreateNovoCliente = async () => {
    if (!novoClienteNome.trim()) {
      alert('Nome do cliente é obrigatório');
      return;
    }

    setCriandoCliente(true);
    try {
      const novoCliente = await createCliente.mutateAsync({
        nome: novoClienteNome.trim(),
        tipo_pessoa: novoClienteTipoPessoa,
        cpf_cnpj: novoClienteCpfCnpj.trim() || undefined,
        telefone: novoClienteTelefone.trim() || undefined,
        email: novoClienteEmail.trim() || undefined,
        endereco: novoClienteEndereco.trim() || undefined,
        contato: novoClienteContato.trim() || undefined,
        ativo: true,
      });

      // Selecionar o novo cliente criado
      setClienteId(novoCliente.id);
      
      // Fechar o diálogo e limpar os campos
      setNovoClienteDialog(false);
      setNovoClienteNome('');
      setNovoClienteTipoPessoa('fisica');
      setNovoClienteCpfCnpj('');
      setNovoClienteTelefone('');
      setNovoClienteEmail('');
      setNovoClienteEndereco('');
      setNovoClienteContato('');
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      alert('Erro ao criar cliente. Tente novamente.');
    } finally {
      setCriandoCliente(false);
    }
  };
  
  const resetForm = () => {
    setClienteId('');
    setEmiteNotaFiscal(false);
    setItens([]);
    setEditingItemIndex(null);
    setShowAddForm(false);
    setNewItem({
      produto_id: '',
      categoria_id: '',
      descricao_customizada: '',
      quantidade: 1,
      valor_unitario: 0,
      detalhes: '',
    });
  };
  
  const handleAddItem = () => {
    setEditingItemIndex(null);
    setShowAddForm(true);
    setNewItem({
      produto_id: '',
      categoria_id: '',
      descricao_customizada: '',
      quantidade: 1,
      valor_unitario: 0,
      detalhes: '',
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
      detalhes: '',
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
      detalhes: '',
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
  
  const calcularTotal = () => {
    return itens.reduce((acc, item) => acc + (item.quantidade * item.valor_unitario), 0);
  };
  
  const handleSubmit = async () => {
    if (!clienteId || itens.length === 0) return;
    
    // Para vendas de loja, usamos a data/hora atual como data de entrega
    const dataHoraEntrega = new Date().toISOString();
    
    const pedidoData = {
      cliente_id: clienteId,
      setor_id: null,
      data_hora_entrega: dataHoraEntrega,
      status: 'executado' as const, // Vendas de loja são executadas imediatamente
      status_pagamento: 'pendente' as const,
      valor_total: calcularTotal(),
      emite_nota_fiscal: emiteNotaFiscal,
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
      // Atualizar o pedido
      await updatePedido.mutateAsync({
        id: pedido.id,
        ...pedidoData,
      });
      
      // Atualizar os itens: primeiro deleta todos os itens existentes
      const { error: deleteError } = await supabase
        .from('itens_pedido')
        .delete()
        .eq('pedido_id', pedido.id);
      
      if (deleteError) {
        console.error('Erro ao deletar itens antigos:', deleteError);
        throw deleteError;
      }
      
      // Depois insere os novos itens
      if (itensData.length > 0) {
        const itensWithPedidoId = itensData.map(item => ({
          ...item,
          pedido_id: pedido.id,
        }));
        
        const { error: insertError } = await supabase
          .from('itens_pedido')
          .insert(itensWithPedidoId);
        
        if (insertError) {
          console.error('Erro ao inserir novos itens:', insertError);
          throw insertError;
        }
      }
      
      // Invalidar o cache dos pedidos para atualizar os itens
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
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
          <DialogTitle>{isEditing ? 'Editar Venda de Loja' : 'Nova Venda de Loja'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Altere os dados da venda de loja' : 'Preencha os dados para registrar uma nova venda de loja'}
          </DialogDescription>
        </DialogHeader>
  
        <div className="space-y-6 py-4">
          {/* Cliente */}
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
  
          {/* Emite Nota Fiscal */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Emite Nota Fiscal</Label>
              <p className="text-sm text-muted-foreground">
                Marque se esta venda de loja requer emissão de nota fiscal
              </p>
            </div>
            <Switch
              checked={emiteNotaFiscal}
              onCheckedChange={setEmiteNotaFiscal}
            />
          </div>
  
          {/* Itens */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Itens da Venda de Loja</Label>
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
                        {produtos
                          ?.filter(p => p.ativo)
                          .filter(p => {
                            const categoriaNome = p.categoria?.nome?.toLowerCase() || '';
                            return !categoriaNome.includes('cesta') &&
                                   !categoriaNome.includes('basket') &&
                                   !categoriaNome.includes('coffee') &&
                                   !categoriaNome.includes('café') &&
                                   !categoriaNome.includes('cafe');
                          })
                          .map((produto) => (
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
                  <span className="text-muted-foreground">Total da Venda de Loja: </span>
                  <span className="text-xl font-semibold text-primary">{formatCurrency(calcularTotal())}</span>
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
              isEditing ? 'Salvar Alterações' : 'Registrar Venda de Loja'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
      
      {/* Dialog para criar novo cliente */}
      <Dialog open={novoClienteDialog} onOpenChange={setNovoClienteDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
            <DialogDescription>
              Cadastre um novo cliente para a venda de loja
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                placeholder="Nome do cliente"
                value={novoClienteNome}
                onChange={(e) => setNovoClienteNome(e.target.value)}
                disabled={criandoCliente}
              />
            </div>
             
            <div className="space-y-2">
              <Label>Tipo de Pessoa *</Label>
              <Select value={novoClienteTipoPessoa} onValueChange={(value: 'fisica' | 'juridica') => setNovoClienteTipoPessoa(value)} disabled={criandoCliente}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fisica">Pessoa Física</SelectItem>
                  <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>
             
            <div className="space-y-2">
              <Label>
                {novoClienteTipoPessoa === 'juridica' ? 'CNPJ' : 'CPF'}
              </Label>
              <Input
                placeholder={novoClienteTipoPessoa === 'juridica' ? '00.000.000/0000-00' : '000.000.000-00'}
                value={novoClienteCpfCnpj}
                onChange={(e) => setNovoClienteCpfCnpj(e.target.value)}
                disabled={criandoCliente}
              />
            </div>
             
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                placeholder="(00) 00000-0000"
                value={novoClienteTelefone}
                onChange={(e) => setNovoClienteTelefone(e.target.value)}
                disabled={criandoCliente}
              />
            </div>
             
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={novoClienteEmail}
                onChange={(e) => setNovoClienteEmail(e.target.value)}
                disabled={criandoCliente}
              />
            </div>
             
            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input
                placeholder="Endereço completo"
                value={novoClienteEndereco}
                onChange={(e) => setNovoClienteEndereco(e.target.value)}
                disabled={criandoCliente}
              />
            </div>
             
            <div className="space-y-2">
              <Label>Contato</Label>
              <Input
                placeholder="Nome do contato"
                value={novoClienteContato}
                onChange={(e) => setNovoClienteContato(e.target.value)}
                disabled={criandoCliente}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovoClienteDialog(false)} disabled={criandoCliente}>
              Cancelar
            </Button>
            <Button onClick={handleCreateNovoCliente} disabled={criandoCliente || !novoClienteNome.trim()}>
              {criandoCliente ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Cliente
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
