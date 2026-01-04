import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Cliente } from '@/types';
import { toast } from 'sonner';

export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data as Cliente[];
    },
  });
}

export function useCliente(id: string) {
  return useQuery({
    queryKey: ['clientes', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Cliente | null;
    },
    enabled: !!id,
  });
}

export function useSetoresCliente(clienteId: string) {
  return useQuery({
    queryKey: ['setores', clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('setores_cliente')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('nome_setor');
      
      if (error) throw error;
      return data;
    },
    enabled: !!clienteId,
  });
}

export function useCreateCliente() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (cliente: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('clientes')
        .insert(cliente)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar cliente: ' + error.message);
    },
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...cliente }: Partial<Cliente> & { id: string }) => {
      const { data, error } = await supabase
        .from('clientes')
        .update({ ...cliente, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar cliente: ' + error.message);
    },
  });
}

export function useDeleteCliente() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir cliente: ' + error.message);
    },
  });
}