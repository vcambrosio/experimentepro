import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { 
  CategoriaFinanceira, 
  LancamentoFinanceiro, 
  FluxoCaixa, 
  Balanco,
  TipoFinanceiro,
  StatusLancamento 
} from '@/types';

// Hook para buscar categorias financeiras
export function useCategoriasFinanceiras(tipo?: TipoFinanceiro) {
  return useQuery({
    queryKey: ['categorias_financeiras', tipo],
    queryFn: async () => {
      let query = supabase
        .from('categorias_financeiras')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (tipo) {
        query = query.eq('tipo', tipo);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as CategoriaFinanceira[];
    },
  });
}

// Hook para buscar lançamentos financeiros
export function useLancamentosFinanceiros(
  tipo?: TipoFinanceiro,
  status?: StatusLancamento,
  dataInicio?: string,
  dataFim?: string
) {
  return useQuery({
    queryKey: ['lancamentos_financeiros', tipo, status, dataInicio, dataFim],
    queryFn: async () => {
      let query = supabase
        .from('lancamentos_financeiros')
        .select(`
          *,
          categoria:categorias_financeiras(*),
          pedido:pedidos(cliente:clientes(nome))
        `)
        .order('data_lancamento', { ascending: false });

      if (tipo) {
        query = query.eq('tipo', tipo);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (dataInicio && dataFim) {
        query = query.gte('data_lancamento', dataInicio).lte('data_lancamento', dataFim);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as LancamentoFinanceiro[];
    },
  });
}

// Hook para buscar um lançamento específico
export function useLancamentoFinanceiro(id: string) {
  return useQuery({
    queryKey: ['lancamento_financeiro', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lancamentos_financeiros')
        .select(`
          *,
          categoria:categorias_financeiras(*),
          pedido:pedidos(cliente:clientes(nome))
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as LancamentoFinanceiro;
    },
    enabled: !!id,
  });
}

// Hook para criar lançamento financeiro
export function useCreateLancamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lancamento: Omit<LancamentoFinanceiro, 'id' | 'created_at' | 'updated_at' | 'categoria' | 'pedido'>) => {
      const { data, error } = await supabase
        .from('lancamentos_financeiros')
        .insert([{
          ...lancamento,
          valor: Number(lancamento.valor),
        }])
        .select()
        .single();

      if (error) throw error;
      return data as LancamentoFinanceiro;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos_financeiros'] });
      queryClient.invalidateQueries({ queryKey: ['resumo_financeiro'] });
    },
  });
}

// Hook para atualizar lançamento financeiro
export function useUpdateLancamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...lancamento }: Partial<LancamentoFinanceiro> & { id: string }) => {
      const { data, error } = await supabase
        .from('lancamentos_financeiros')
        .update({
          ...lancamento,
          valor: lancamento.valor !== undefined ? Number(lancamento.valor) : undefined,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as LancamentoFinanceiro;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos_financeiros'] });
      queryClient.invalidateQueries({ queryKey: ['lancamento_financeiro'] });
      queryClient.invalidateQueries({ queryKey: ['resumo_financeiro'] });
    },
  });
}

// Hook para deletar lançamento financeiro
export function useDeleteLancamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lancamentos_financeiros')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos_financeiros'] });
      queryClient.invalidateQueries({ queryKey: ['resumo_financeiro'] });
    },
  });
}

// Hook para deletar categoria financeira
export function useDeleteCategoriaFinanceira() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categorias_financeiras')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias_financeiras'] });
    },
  });
}

// Hook para criar categoria financeira
export function useCreateCategoriaFinanceira() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoria: Omit<CategoriaFinanceira, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('categorias_financeiras')
        .insert([categoria])
        .select()
        .single();

      if (error) throw error;
      return data as CategoriaFinanceira;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias_financeiras'] });
    },
  });
}

// Hook para atualizar categoria financeira
export function useUpdateCategoriaFinanceira() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...categoria }: Partial<CategoriaFinanceira> & { id: string }) => {
      const { data, error } = await supabase
        .from('categorias_financeiras')
        .update(categoria)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CategoriaFinanceira;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias_financeiras'] });
    },
  });
}

// Hook para buscar resumo financeiro
export function useResumoFinanceiro(dataInicio?: string, dataFim?: string) {
  return useQuery({
    queryKey: ['resumo_financeiro', dataInicio, dataFim],
    queryFn: async () => {
      let query = supabase
        .from('lancamentos_financeiros')
        .select('*');

      if (dataInicio && dataFim) {
        query = query.gte('data_lancamento', dataInicio).lte('data_lancamento', dataFim);
      }

      const { data, error } = await query;

      if (error) throw error;

      const lancamentos = data as LancamentoFinanceiro[];
      
      const receitas = lancamentos.filter(l => l.tipo === 'receita');
      const despesas = lancamentos.filter(l => l.tipo === 'despesa');
      
      const receitasPendentes = receitas.filter(l => l.status === 'pendente');
      const receitasRealizadas = receitas.filter(l => l.status === 'realizado');
      const despesasPendentes = despesas.filter(l => l.status === 'pendente');
      const despesasRealizadas = despesas.filter(l => l.status === 'realizado');

      return {
        totalReceitas: receitas.reduce((acc, l) => acc + l.valor, 0),
        totalDespesas: despesas.reduce((acc, l) => acc + l.valor, 0),
        receitasPendentes: receitasPendentes.reduce((acc, l) => acc + l.valor, 0),
        receitasRealizadas: receitasRealizadas.reduce((acc, l) => acc + l.valor, 0),
        despesasPendentes: despesasPendentes.reduce((acc, l) => acc + l.valor, 0),
        despesasRealizadas: despesasRealizadas.reduce((acc, l) => acc + l.valor, 0),
        saldo: receitas.reduce((acc, l) => acc + l.valor, 0) - despesas.reduce((acc, l) => acc + l.valor, 0),
        saldoRealizado: receitasRealizadas.reduce((acc, l) => acc + l.valor, 0) - despesasRealizadas.reduce((acc, l) => acc + l.valor, 0),
        quantidadeReceitas: receitas.length,
        quantidadeDespesas: despesas.length,
      };
    },
  });
}

// Hook para buscar fluxo de caixa
export function useFluxoCaixa(dataInicio?: string, dataFim?: string) {
  return useQuery({
    queryKey: ['fluxo_caixa', dataInicio, dataFim],
    queryFn: async () => {
      let query = supabase
        .from('lancamentos_financeiros')
        .select('*')
        .order('data_lancamento', { ascending: true });

      if (dataInicio && dataFim) {
        query = query.gte('data_lancamento', dataInicio).lte('data_lancamento', dataFim);
      }

      const { data, error } = await query;

      if (error) throw error;

      const lancamentos = data as LancamentoFinanceiro[];
      const fluxoPorData = new Map<string, FluxoCaixa>();

      // Agrupar por data
      lancamentos.forEach(lancamento => {
        const data = lancamento.data_lancamento.split('T')[0];
        
        if (!fluxoPorData.has(data)) {
          fluxoPorData.set(data, {
            data,
            receitas: 0,
            despesas: 0,
            saldo: 0,
            receitas_realizadas: 0,
            despesas_realizadas: 0,
            saldo_realizado: 0,
          });
        }

        const fluxo = fluxoPorData.get(data)!;
        
        if (lancamento.tipo === 'receita') {
          fluxo.receitas += lancamento.valor;
          if (lancamento.status === 'realizado') {
            fluxo.receitas_realizadas += lancamento.valor;
          }
        } else {
          fluxo.despesas += lancamento.valor;
          if (lancamento.status === 'realizado') {
            fluxo.despesas_realizadas += lancamento.valor;
          }
        }
        
        fluxo.saldo = fluxo.receitas - fluxo.despesas;
        fluxo.saldo_realizado = fluxo.receitas_realizadas - fluxo.despesas_realizadas;
      });

      return Array.from(fluxoPorData.values());
    },
  });
}

// Hook para buscar balanço
export function useBalanco(dataInicio?: string, dataFim?: string) {
  return useQuery({
    queryKey: ['balanco', dataInicio, dataFim],
    queryFn: async () => {
      let query = supabase
        .from('lancamentos_financeiros')
        .select(`
          *,
          categoria:categorias_financeiras(*)
        `)
        .order('data_lancamento', { ascending: false });

      if (dataInicio && dataFim) {
        query = query.gte('data_lancamento', dataInicio).lte('data_lancamento', dataFim);
      }

      const { data: lancamentos, error } = await query;

      if (error) throw error;

      const lancamentosData = (lancamentos || []) as LancamentoFinanceiro[];
      
      const receitas = lancamentosData.filter(l => l.tipo === 'receita');
      const despesas = lancamentosData.filter(l => l.tipo === 'despesa');
      
      const totalReceitas = receitas.reduce((acc, l) => acc + l.valor, 0);
      const totalDespesas = despesas.reduce((acc, l) => acc + l.valor, 0);
      
      // Agrupar receitas por categoria
      const receitasPorCategoria = new Map<string, number>();
      receitas.forEach(l => {
        const categoria = l.categoria?.nome || 'Outros';
        receitasPorCategoria.set(categoria, (receitasPorCategoria.get(categoria) || 0) + l.valor);
      });
      
      // Agrupar despesas por categoria
      const despesasPorCategoria = new Map<string, number>();
      despesas.forEach(l => {
        const categoria = l.categoria?.nome || 'Outros';
        despesasPorCategoria.set(categoria, (despesasPorCategoria.get(categoria) || 0) + l.valor);
      });

      const balanco: Balanco = {
        periodo: dataInicio && dataFim ? `${dataInicio} a ${dataFim}` : 'Todo o período',
        totalReceitas,
        totalDespesas,
        lucro: totalReceitas - totalDespesas,
        receitasPorCategoria: Array.from(receitasPorCategoria.entries()).map(([categoria, valor]) => ({
          categoria,
          valor,
          porcentagem: totalReceitas > 0 ? (valor / totalReceitas) * 100 : 0,
        })),
        despesasPorCategoria: Array.from(despesasPorCategoria.entries()).map(([categoria, valor]) => ({
          categoria,
          valor,
          porcentagem: totalDespesas > 0 ? (valor / totalDespesas) * 100 : 0,
        })),
      };

      return balanco;
    },
  });
}
