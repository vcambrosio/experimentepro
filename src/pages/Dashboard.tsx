import { useAuth } from '@/contexts/AuthContext';
import { usePedidos } from '@/hooks/usePedidos';
import { useOrcamentos } from '@/hooks/useOrcamentos';
import { useClientes } from '@/hooks/useClientes';
import { useProdutos } from '@/hooks/useProdutos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Clock, 
  CheckCircle, 
  DollarSign, 
  TrendingUp,
  Users,
  Package,
  FileText
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarioWidget } from '@/components/calendario/CalendarioWidget';

export default function Dashboard() {
  const { isAdmin, profile } = useAuth();
  const { data: pedidos, isLoading: loadingPedidos } = usePedidos();
  const { data: orcamentos, isLoading: loadingOrcamentos } = useOrcamentos();
  const { data: clientes, isLoading: loadingClientes } = useClientes();
  const { data: produtos, isLoading: loadingProdutos } = useProdutos();

  const pedidosPendentes = pedidos?.filter(p => p.status === 'pendente').length || 0;
  const pedidosExecutados = pedidos?.filter(p => p.status === 'executado').length || 0;
  const orcamentosPendentes = orcamentos?.filter(o => o.status === 'pendente').length || 0;
  const orcamentosAprovados = orcamentos?.filter(o => o.status === 'aprovado').length || 0;
  const totalClientes = clientes?.filter(c => c.ativo).length || 0;
  const totalProdutos = produtos?.filter(p => p.ativo).length || 0;
  
  const valorAReceber = pedidos
    ?.filter(p => p.status === 'executado' && p.status_pagamento === 'pendente')
    .reduce((acc, p) => acc + (p.valor_total || 0), 0) || 0;
  
  const valorRecebido = pedidos
    ?.filter(p => p.status_pagamento === 'pago')
    .reduce((acc, p) => acc + (p.valor_total || 0), 0) || 0;

  const valorOrcamentos = orcamentos
    ?.filter(o => o.status === 'pendente')
    .reduce((acc, o) => acc + (o.valor_total || 0), 0) || 0;

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const isLoading = loadingPedidos || loadingOrcamentos || loadingClientes || loadingProdutos;


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Olá{profile?.full_name ? `, ${profile.full_name}` : ''}! 👋
        </h1>
        <p className="text-muted-foreground">Visão geral do seu negócio</p>
      </div>

      {/* Calendário */}
      <CalendarioWidget pedidos={pedidos || []} isLoading={isLoading} />

      {/* Cards principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-warning hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos de Evento ou Cesta Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{pedidosPendentes}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">aguardando execução</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos de Evento ou Cesta Executados</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{pedidosExecutados}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">finalizados</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-info hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orçamentos Pendentes</CardTitle>
            <FileText className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{orcamentosPendentes}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(valorOrcamentos)} em aberto
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orçamentos Aprovados</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{orcamentosAprovados}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">prontos para pedido</p>
          </CardContent>
        </Card>
      </div>

      {/* Cards financeiros (apenas admin) */}
      {isAdmin && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">A Receber</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-2xl font-bold text-primary">{formatCurrency(valorAReceber)}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">pagamento pendente</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-success hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Recebido</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-2xl font-bold text-success">{formatCurrency(valorRecebido)}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">total recebido</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-secondary hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Clientes Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold">{totalClientes}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">cadastrados</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-secondary hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Produtos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold">{totalProdutos}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">no catálogo</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}