import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ChecklistItem } from '@/types';
import { toast } from 'sonner';

export function useChecklistItens(produtoId: string) {
  return useQuery({
    queryKey: ['checklist', produtoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_itens')
        .select('*')
        .eq('produto_id', produtoId)
        .order('ordem');
      
      if (error) throw error;
      return data as ChecklistItem[];
    },
    enabled: !!produtoId,
  });
}

export function useCreateChecklistItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: Omit<ChecklistItem, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('checklist_itens')
        .insert(item)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist'] });
      toast.success('Item de checklist adicionado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar item: ' + error.message);
    },
  });
}

export function useUpdateChecklistItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...item }: Partial<ChecklistItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('checklist_itens')
        .update(item)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist'] });
      toast.success('Item de checklist atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar item: ' + error.message);
    },
  });
}

export function useDeleteChecklistItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('checklist_itens')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist'] });
      toast.success('Item de checklist excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir item: ' + error.message);
    },
  });
}

export function useChecklistItensByProdutos(produtoIds: string[]) {
  return useQuery({
    queryKey: ['checklist', 'produtos', produtoIds],
    queryFn: async () => {
      if (produtoIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('checklist_itens')
        .select('*')
        .in('produto_id', produtoIds)
        .order('ordem');
      
      if (error) throw error;
      return data as ChecklistItem[];
    },
    enabled: produtoIds.length > 0,
  });
}