import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ChecklistItem } from '@/types';

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