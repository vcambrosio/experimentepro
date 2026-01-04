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
      console.log('Iniciando exclusão da categoria:', id);
      
      // Primeiro, verificar se existem produtos (ativos e inativos) usando esta categoria
      const { data: produtosUsandoCategoria } = await supabase
        .from('produtos')
        .select('id, nome, ativo')
        .eq('categoria_id', id);
      
      console.log('Produtos usando a categoria:', produtosUsandoCategoria);
      
      if (produtosUsandoCategoria && produtosUsandoCategoria.length > 0) {
        // Se existem produtos usando a categoria, mostrar erro
        const nomesProdutos = produtosUsandoCategoria.map(p => `${p.nome} (${p.ativo ? 'ativo' : 'inativo'})`).join(', ');
        console.error('Categoria em uso por produtos:', nomesProdutos);
        throw new Error(
          `Esta categoria está sendo usada por ${produtosUsandoCategoria.length} produto(s): ${nomesProdutos}. ` +
          `Remova os produtos ou altere a categoria deles antes de excluir esta categoria.`
        );
      }
      
      // Se não houver produtos usando a categoria, pode excluir
      console.log('Excluindo categoria do banco...', id);
      const { data, error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id)
        .select();
      
      console.log('Resultado da exclusão:', { data, error });
      
      if (error) {
        console.error('Erro ao excluir categoria:', error);
        throw new Error(`Erro ao excluir categoria: ${error.message}`);
      }
      
      // Verificar se alguma linha foi realmente excluída
      if (!data || data.length === 0) {
        console.error('Nenhuma linha foi excluída. data:', data);
        throw new Error('Categoria não encontrada ou não foi possível excluí-la. Verifique as permissões no Supabase.');
      }
      
      console.log('Exclusão bem-sucedida, categoria excluída:', data);
    },
    onSuccess: (_, id) => {
      console.log('Categoria excluída com sucesso, invalidando queries...');
      // Invalidar queries para forçar atualização
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      queryClient.invalidateQueries({ queryKey: ['categorias', id] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success('Categoria excluída com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error deleting category:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast.error(error.message || 'Erro ao excluir categoria');
    },
  });
}