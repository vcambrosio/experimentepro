import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Pedido, ItemPedido } from '@/types';
import { toast } from 'sonner';

export function usePedidos() {
  return useQuery({
    queryKey: ['pedidos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          cliente:clientes(*),
          setor:setores_cliente(*)
        `)
        .order('data_hora_entrega', { ascending: false });
      
      if (error) throw error;
      return data as Pedido[];
    },
  });
}

export function usePedido(id: string) {
  return useQuery({
    queryKey: ['pedidos', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          cliente:clientes(*),
          setor:setores_cliente(*),
          itens:itens_pedido(
            *,
            produto:produtos(*),
            categoria:categorias(*)
          )
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Pedido | null;
    },
    enabled: !!id,
  });
}

export function usePedidosByDateRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['pedidos', 'range', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          cliente:clientes(*),
          setor:setores_cliente(*)
        `)
        .gte('data_hora_entrega', startDate)
        .lte('data_hora_entrega', endDate)
        .order('data_hora_entrega');
      
      if (error) throw error;
      return data as Pedido[];
    },
    enabled: !!startDate && !!endDate,
  });
}

export function useCreatePedido() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      pedido, 
      itens 
    }: { 
      pedido: Omit<Pedido, 'id' | 'created_at' | 'updated_at' | 'cliente' | 'setor' | 'orcamento' | 'itens'>;
      itens: Omit<ItemPedido, 'id' | 'pedido_id' | 'created_at' | 'produto' | 'categoria'>[];
    }) => {
      const { data: pedidoData, error: pedidoError } = await supabase
        .from('pedidos')
        .insert(pedido)
        .select()
        .single();
      
      if (pedidoError) throw pedidoError;
      
      if (itens.length > 0) {
        const itensWithPedidoId = itens.map(item => ({
          ...item,
          pedido_id: pedidoData.id,
        }));
        
        const { error: itensError } = await supabase
          .from('itens_pedido')
          .insert(itensWithPedidoId);
        
        if (itensError) throw itensError;
      }
      
      return pedidoData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast.success('Pedido criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar pedido: ' + error.message);
    },
  });
}

export function useUpdatePedido() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...pedido }: Partial<Pedido> & { id: string }) => {
      const { cliente, setor, orcamento, itens, ...rest } = pedido;
      const { data, error } = await supabase
        .from('pedidos')
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast.success('Pedido atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar pedido: ' + error.message);
    },
  });
}

export function useDeletePedido() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Delete items first
      await supabase
        .from('itens_pedido')
        .delete()
        .eq('pedido_id', id);
      
      const { error } = await supabase
        .from('pedidos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast.success('Pedido excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir pedido: ' + error.message);
    },
  });
}