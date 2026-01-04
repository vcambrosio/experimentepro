import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { SetorCliente } from '@/types';
import { toast } from 'sonner';

export function useCreateSetor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (setor: Omit<SetorCliente, 'id' | 'created_at'>) => {
      console.log('Criando setor:', setor);
      const { data, error } = await supabase
        .from('setores_cliente')
        .insert(setor)
        .select()
        .single();
      
      console.log('Resultado da criação do setor:', { data, error });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setores'] });
      toast.success('Setor adicionado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao adicionar setor:', error);
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
      // Verificar se há pedidos relacionados antes de excluir
      const { data: pedidos, error: checkError } = await supabase
        .from('pedidos')
        .select('id, numero_orcamento')
        .eq('setor_id', id);
      
      if (checkError) {
        console.error('Erro ao verificar pedidos:', checkError);
        throw new Error('Erro ao verificar pedidos relacionados');
      }
      
      console.log('Pedidos relacionados ao setor:', pedidos);
      
      // Se houver pedidos relacionados, impedir a exclusão
      if (pedidos && pedidos.length > 0) {
        const numerosPedidos = pedidos.map(p => p.numero_orcamento).join(', ');
        throw new Error(
          `Este setor está sendo usado em ${pedidos.length} pedido(s): ${numerosPedidos}. ` +
          `Remova os pedidos ou altere o setor deles antes de excluir este setor.`
        );
      }
      
      // Se não houver pedidos, pode excluir
      const { error } = await supabase
        .from('setores_cliente')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao excluir setor:', error);
        throw error;
      }
      
      console.log('Setor excluído com sucesso:', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setores'] });
      toast.success('Setor excluído com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao excluir setor:', error);
      const mensagem = error.message || 'Erro desconhecido';
      
      // Verificar se é erro de FK e personalizar a mensagem
      if (mensagem.includes('violates foreign key constraint') || mensagem.includes('violates row level security policy')) {
        toast.error(
          'Não é possível excluir este setor pois existem pedidos vinculados. ' +
          'Remova ou altere os pedidos relacionados antes de excluir o setor.'
        );
      } else {
        toast.error('Erro ao excluir setor: ' + mensagem);
      }
    },
  });
}
