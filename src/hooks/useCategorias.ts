import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Categoria } from '@/types';
import { toast } from 'sonner';

export function useCategorias() {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data as Categoria[];
    },
  });
}

export function useCategoria(id: string) {
  return useQuery({
    queryKey: ['categorias', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Categoria | null;
    },
    enabled: !!id,
  });
}

export function useCreateCategoria() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (categoria: Omit<Categoria, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('categorias')
        .insert(categoria)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      toast.success('Categoria criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar categoria: ' + error.message);
    },
  });
}

export function useUpdateCategoria() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...categoria }: Partial<Categoria> & { id: string }) => {
      const { data, error } = await supabase
        .from('categorias')
        .update({ ...categoria, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      toast.success('Categoria atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar categoria: ' + error.message);
    },
  });
}

export function useDeleteCategoria() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      toast.success('Categoria excluída com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir categoria: ' + error.message);
    },
  });
}