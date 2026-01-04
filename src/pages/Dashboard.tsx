import { useAuth } from '@/contexts/AuthContext';
import { usePedidos } from '@/hooks/usePedidos';
import { useOrcamentos } from '@/hooks/useOrcamentos';
import { useClientes } from '@/hooks/useClientes';
import { useProdutos } from '@/hooks/useProdutos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  FileText, 
  Clock, 
  CheckCircle, 
  DollarSign, 
  TrendingUp,
  Users,
  Package,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const isLoading = loadingPedidos || loadingOrcamentos || loadingClientes || loadingProdutos;

  // Pedidos recentes (últimos 5)
  const pedidosRecentes = pedidos
    ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5) || [];

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pendente: { label: 'Pendente', className: 'bg-warning text-warning-foreground' },
      executado: { label: 'Executado', className: 'bg-success text-success-foreground' },
      cancelado: { label: 'Cancelado', className: 'bg-destructive text-destructive-foreground' },
      aprovado: { label: 'Aprovado', className: 'bg-success text-success-foreground' },
      recusado: { label: 'Recusado', className: 'bg-destructive text-destructive-foreground' },
    };
    const config = statusConfig[status] || { label: status, className: 'bg-muted' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Olá{profile?.full_name ? `, ${profile.full_name}` : ''}! 👋
        </h1>
        <p className="text-muted-foreground">Visão geral do seu negócio</p>
      </div>

      {/* Cards principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-warning hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos Pendentes</CardTitle>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos Executados</CardTitle>
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

      {/* Seção de Atividade Recente e Ações Rápidas */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pedidos Recentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium">Pedidos Recentes</CardTitle>
            <Link 
              to="/pedidos" 
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : pedidosRecentes.length > 0 ? (
              <div className="space-y-3">
                {pedidosRecentes.map(pedido => (
                  <div key={pedido.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {pedido.cliente?.nome || 'Cliente'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(pedido.created_at), "dd 'de' MMM", { locale: ptBR })}
                        {pedido.valor_total && ` • ${formatCurrency(pedido.valor_total)}`}
                      </p>
                    </div>
                    {getStatusBadge(pedido.status)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Nenhum pedido ainda</p>
                <Link to="/pedidos" className="text-sm text-primary hover:underline">
                  Criar primeiro pedido
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Link 
              to="/pedidos" 
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 hover:border-primary/50 transition-all group"
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Novo Pedido</p>
                <p className="text-xs text-muted-foreground">Registrar venda para cliente</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>

            <Link 
              to="/orcamentos" 
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 hover:border-primary/50 transition-all group"
            >
              <div className="h-10 w-10 rounded-full bg-info/10 flex items-center justify-center group-hover:bg-info/20 transition-colors">
                <FileText className="h-5 w-5 text-info" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Novo Orçamento</p>
                <p className="text-xs text-muted-foreground">Criar proposta comercial</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>

            <Link 
              to="/calendario" 
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 hover:border-primary/50 transition-all group"
            >
              <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center group-hover:bg-warning/20 transition-colors">
                <Calendar className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Ver Calendário</p>
                <p className="text-xs text-muted-foreground">Entregas programadas</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>

            <Link 
              to="/clientes/novo" 
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 hover:border-primary/50 transition-all group"
            >
              <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors">
                <Users className="h-5 w-5 text-success" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Novo Cliente</p>
                <p className="text-xs text-muted-foreground">Cadastrar novo cliente</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}