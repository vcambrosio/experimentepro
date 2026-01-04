import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ConfiguracaoEmpresa } from '@/types';
import { toast } from 'sonner';

export function useConfiguracaoEmpresa() {
  return useQuery({
    queryKey: ['configuracao_empresa'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracao_empresa')
        .select('*')
        .maybeSingle();
      
      if (error) throw error;
      return data as ConfiguracaoEmpresa | null;
    },
  });
}

export function useUpdateConfiguracaoEmpresa() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (config: Partial<ConfiguracaoEmpresa> & { id?: string }) => {
      const { id, ...rest } = config;
      
      if (id) {
        // Update existing
        const { data, error } = await supabase
          .from('configuracao_empresa')
          .update({ ...rest, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('configuracao_empresa')
          .insert(rest)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracao_empresa'] });
      toast.success('Configurações salvas com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao salvar configurações: ' + error.message);
    },
  });
}