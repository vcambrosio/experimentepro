import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Orcamento, ItemOrcamento } from '@/types';
import { toast } from 'sonner';

export function useOrcamentos() {
  return useQuery({
    queryKey: ['orcamentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orcamentos')
        .select(`
          *,
          cliente:clientes(*),
          setor:setores_cliente(*),
          itens:itens_orcamento(
            *,
            produto:produtos(*),
            categoria:categorias(*)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Orcamento[];
    },
  });
}

export function useOrcamento(id: string) {
  return useQuery({
    queryKey: ['orcamentos', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orcamentos')
        .select(`
          *,
          cliente:clientes(*),
          setor:setores_cliente(*),
          itens:itens_orcamento(
            *,
            produto:produtos(*),
            categoria:categorias(*)
          )
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Orcamento | null;
    },
    enabled: !!id,
  });
}

export function useCreateOrcamento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      orcamento, 
      itens 
    }: { 
      orcamento: Omit<Orcamento, 'id' | 'created_at' | 'updated_at' | 'cliente' | 'setor' | 'itens'>;
      itens: Omit<ItemOrcamento, 'id' | 'orcamento_id' | 'created_at' | 'produto' | 'categoria'>[];
    }) => {
      const { data: orcamentoData, error: orcamentoError } = await supabase
        .from('orcamentos')
        .insert(orcamento)
        .select()
        .single();
      
      if (orcamentoError) throw orcamentoError;
      
      if (itens.length > 0) {
        const itensWithOrcamentoId = itens.map(item => ({
          ...item,
          orcamento_id: orcamentoData.id,
        }));
        
        const { error: itensError } = await supabase
          .from('itens_orcamento')
          .insert(itensWithOrcamentoId);
        
        if (itensError) throw itensError;
      }
      
      return orcamentoData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      toast.success('Orçamento criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar orçamento: ' + error.message);
    },
  });
}

export function useUpdateOrcamento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      id,
      itens,
      ...orcamento
    }: Partial<Orcamento> & {
      id: string;
      itens?: Omit<ItemOrcamento, 'id' | 'orcamento_id' | 'created_at' | 'produto' | 'categoria'>[];
    }) => {
      const { cliente, setor, ...rest } = orcamento;
      
      // Update orcamento
      const { data, error } = await supabase
        .from('orcamentos')
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update items if provided
      if (itens) {
        // Delete old items
        const { error: deleteError } = await supabase
          .from('itens_orcamento')
          .delete()
          .eq('orcamento_id', id);
        
        if (deleteError) throw deleteError;
        
        // Insert new items
        if (itens.length > 0) {
          const itensWithOrcamentoId = itens.map(item => ({
            ...item,
            orcamento_id: id,
          }));
          
          const { error: insertError } = await supabase
            .from('itens_orcamento')
            .insert(itensWithOrcamentoId);
          
          if (insertError) throw insertError;
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      toast.success('Orçamento atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar orçamento: ' + error.message);
    },
  });
}

export function useDeleteOrcamento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Delete items first
      await supabase
        .from('itens_orcamento')
        .delete()
        .eq('orcamento_id', id);
      
      const { error } = await supabase
        .from('orcamentos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      toast.success('Orçamento excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir orçamento: ' + error.message);
    },
  });
}

export function useConvertOrcamentoToPedido() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orcamentoId: string) => {
      // Get orcamento with items
      const { data: orcamento, error: orcamentoError } = await supabase
        .from('orcamentos')
        .select(`
          *,
          itens:itens_orcamento(*)
        `)
        .eq('id', orcamentoId)
        .single();
      
      if (orcamentoError) throw orcamentoError;
      
      // Calculate data_hora_entrega from orcamento data_entrega and hora_entrega
      let dataHoraEntrega = new Date().toISOString();
      if (orcamento.data_entrega) {
        const dataEntrega = new Date(orcamento.data_entrega);
        if (orcamento.hora_entrega) {
          const [hours, minutes] = orcamento.hora_entrega.split(':');
          dataEntrega.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        }
        dataHoraEntrega = dataEntrega.toISOString();
      }
      
      // Create pedido
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .insert({
          cliente_id: orcamento.cliente_id,
          setor_id: orcamento.setor_id,
          orcamento_id: orcamento.id,
          tipo_pedido: 'evento_cesta',
          data_hora_entrega: dataHoraEntrega,
          status: 'pendente',
          status_pagamento: 'pendente',
          valor_total: orcamento.valor_total,
          created_by: orcamento.created_by,
        })
        .select()
        .single();
      
      if (pedidoError) throw pedidoError;
      
      // Create pedido items
      if (orcamento.itens && orcamento.itens.length > 0) {
        const itensPedido = orcamento.itens.map((item: ItemOrcamento) => ({
          pedido_id: pedido.id,
          produto_id: item.produto_id,
          categoria_id: item.categoria_id,
          descricao_customizada: item.descricao_customizada,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          valor_total: item.valor_total,
          detalhes: item.observacoes,
        }));
        
        const { error: itensError } = await supabase
          .from('itens_pedido')
          .insert(itensPedido);
        
        if (itensError) throw itensError;
      }
      
      // Update orcamento status
      await supabase
        .from('orcamentos')
        .update({ status: 'aprovado' })
        .eq('id', orcamentoId);
      
      return pedido;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast.success('Orçamento convertido em pedido com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao converter orçamento: ' + error.message);
    },
  });
}