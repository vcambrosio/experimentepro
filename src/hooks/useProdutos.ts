import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Produto } from '@/types';
import { toast } from 'sonner';

export function useProdutos() {
  return useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select(`
          *,
          categoria:categorias(*)
        `)
        .order('nome');
      
      if (error) throw error;
      return data as Produto[];
    },
  });
}

export function useProduto(id: string) {
  return useQuery({
    queryKey: ['produtos', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select(`
          *,
          categoria:categorias(*)
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Produto | null;
    },
    enabled: !!id,
  });
}

export function useProdutosByCategoria(categoriaId: string) {
  return useQuery({
    queryKey: ['produtos', 'categoria', categoriaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select(`
          *,
          categoria:categorias(*)
        `)
        .eq('categoria_id', categoriaId)
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      return data as Produto[];
    },
    enabled: !!categoriaId,
  });
}

export function useCreateProduto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (produto: Omit<Produto, 'id' | 'created_at' | 'updated_at' | 'categoria'>) => {
      const { data, error } = await supabase
        .from('produtos')
        .insert(produto)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success('Produto criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar produto: ' + error.message);
    },
  });
}

export function useUpdateProduto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...produto }: Partial<Produto> & { id: string }) => {
      const { categoria, ...rest } = produto;
      const { data, error } = await supabase
        .from('produtos')
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success('Produto atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar produto: ' + error.message);
    },
  });
}

export function useDeleteProduto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success('Produto excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir produto: ' + error.message);
    },
  });
}