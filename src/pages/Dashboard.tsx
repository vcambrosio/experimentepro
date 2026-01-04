import { useAuth } from '@/contexts/AuthContext';
import { usePedidos } from '@/hooks/usePedidos';
import { useOrcamentos } from '@/hooks/useOrcamentos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, FileText, Clock, CheckCircle, DollarSign, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const { data: pedidos, isLoading: loadingPedidos } = usePedidos();
  const { data: orcamentos, isLoading: loadingOrcamentos } = useOrcamentos();

  const pedidosPendentes = pedidos?.filter(p => p.status === 'pendente').length || 0;
  const pedidosExecutados = pedidos?.filter(p => p.status === 'executado').length || 0;
  const orcamentosPendentes = orcamentos?.filter(o => o.status === 'pendente').length || 0;
  
  const valorAReceber = pedidos
    ?.filter(p => p.status === 'executado' && p.status_pagamento === 'pendente')
    .reduce((acc, p) => acc + p.valor_total, 0) || 0;
  
  const valorRecebido = pedidos
    ?.filter(p => p.status_pagamento === 'pago')
    .reduce((acc, p) => acc + p.valor_total, 0) || 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const isLoading = loadingPedidos || loadingOrcamentos;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu negócio</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{pedidosPendentes}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos Executados</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{pedidosExecutados}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-info">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orçamentos Pendentes</CardTitle>
            <FileText className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{orcamentosPendentes}</div>
            )}
          </CardContent>
        </Card>

        {isAdmin && (
          <>
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">A Receber</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-8 w-24" /> : (
                  <div className="text-2xl font-bold text-primary">{formatCurrency(valorAReceber)}</div>
                )}
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-success">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Recebido</CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-8 w-24" /> : (
                  <div className="text-2xl font-bold text-success">{formatCurrency(valorRecebido)}</div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="text-center py-12 text-muted-foreground">
        <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Configure seu Supabase para ver os dados completos</p>
        <p className="text-sm">Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis de ambiente</p>
      </div>
    </div>
  );
}