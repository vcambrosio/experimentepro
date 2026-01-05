import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, UserPlus } from 'lucide-react';
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
  };
  
  const addItem = () => {
    const novoItem = {
      produto_id: '',
      categoria_id: '',
      descricao_customizada: '',
      quantidade: 1,
      valor_unitario: 0,
      detalhes: '',
    };
    
    // Se já houver itens, adiciona o novo item no início da lista
    if (itens.length > 0) {
      setItens([novoItem, ...itens]);
    } else {
      // Se não houver itens, adiciona normalmente
      setItens([novoItem]);
    }
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
              <ScrollArea className="h-[500px] pr-4">
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
                            className="no-spinner"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Valor Unit.</Label>
                          <Input
                            type="text"
                            min="0"
                            value={item.valor_unitario.toFixed(2).replace('.', ',')}
                            onChange={(e) => {
                              const value = e.target.value.replace(',', '.');
                              updateItem(index, 'valor_unitario', parseFloat(value) || 0);
                            }}
                            className="no-spinner"
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
                   
                  <div className="flex justify-end p-4 bg-muted rounded-lg sticky bottom-0">
                    <div className="text-right">
                      <span className="text-muted-foreground">Total da Venda de Loja: </span>
                      <span className="text-xl font-semibold text-primary">{formatCurrency(calcularTotal())}</span>
                    </div>
                  </div>
                </div>
              </ScrollArea>
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
