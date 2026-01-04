import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { SetorCliente } from '@/types';
import { toast } from 'sonner';

export function useCreateSetor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (setor: Omit<SetorCliente, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('setores_cliente')
        .insert(setor)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setores'] });
      toast.success('Setor adicionado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar setor: ' + error.message);
    },
  });
}

export function useUpdateSetor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...setor }: Partial<SetorCliente> & { id: string }) => {
      const { data, error } = await supabase
        .from('setores_cliente')
        .update(setor)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setores'] });
      toast.success('Setor atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar setor: ' + error.message);
    },
  });
}

export function useDeleteSetor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('setores_cliente')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setores'] });
      toast.success('Setor excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir setor: ' + error.message);
    },
  });
}
