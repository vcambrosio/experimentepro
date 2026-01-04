import { useState, useMemo } from 'react';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear, 
  eachWeekOfInterval,
  eachMonthOfInterval,
  isWithinInterval,
  subMonths
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  FileText,
  TrendingUp,
  AlertCircle,
  Receipt
} from 'lucide-react';
import { usePedidos } from '@/hooks/usePedidos';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

type ViewPeriod = 'week' | 'month' | 'year';

export default function Financeiro() {
  const { isAdmin } = useAuth();
  const { data: pedidos, isLoading } = usePedidos();
  const [viewPeriod, setViewPeriod] = useState<ViewPeriod>('month');

  // Redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Filter pedidos by status
  const pedidosPendentes = useMemo(() => 
    pedidos?.filter(p => p.status !== 'cancelado' && p.status_pagamento === 'pendente') || [],
    [pedidos]
  );

  const pedidosPagos = useMemo(() => 
    pedidos?.filter(p => p.status_pagamento === 'pago') || [],
    [pedidos]
  );

  const pedidosComNota = useMemo(() => 
    pedidos?.filter(p => p.cliente?.emite_nota_fiscal) || [],
    [pedidos]
  );

  const pedidosSemNota = useMemo(() => 
    pedidos?.filter(p => !p.cliente?.emite_nota_fiscal) || [],
    [pedidos]
  );

  // Calculate totals
  const totalPendente = pedidosPendentes.reduce((acc, p) => acc + (p.valor_total || 0), 0);
  const totalPago = pedidosPagos.reduce((acc, p) => acc + (p.valor_total || 0), 0);
  const totalComNota = pedidosComNota.reduce((acc, p) => acc + (p.valor_total || 0), 0);
  const totalSemNota = pedidosSemNota.reduce((acc, p) => acc + (p.valor_total || 0), 0);

  // Generate chart data based on period
  const chartData = useMemo(() => {
    if (!pedidos) return [];

    const now = new Date();
    
    if (viewPeriod === 'week') {
      // Last 8 weeks
      const weeks = eachWeekOfInterval({
        start: subMonths(now, 2),
        end: now,
      }, { weekStartsOn: 0 });

      return weeks.map(weekStart => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
        const weekPedidos = pedidos.filter(p => {
          const pedidoDate = new Date(p.data_hora_entrega);
          return isWithinInterval(pedidoDate, { start: weekStart, end: weekEnd });
        });

        const total = weekPedidos.reduce((acc, p) => acc + (p.valor_total || 0), 0);
        const pago = weekPedidos
          .filter(p => p.status_pagamento === 'pago')
          .reduce((acc, p) => acc + (p.valor_total || 0), 0);

        return {
          name: format(weekStart, "'Sem' w", { locale: ptBR }),
          total,
          pago,
          pendente: total - pago,
        };
      });
    } else if (viewPeriod === 'month') {
      // Last 12 months
      const months = eachMonthOfInterval({
        start: subMonths(now, 11),
        end: now,
      });

      return months.map(monthStart => {
        const monthEnd = endOfMonth(monthStart);
        const monthPedidos = pedidos.filter(p => {
          const pedidoDate = new Date(p.data_hora_entrega);
          return isWithinInterval(pedidoDate, { start: monthStart, end: monthEnd });
        });

        const total = monthPedidos.reduce((acc, p) => acc + (p.valor_total || 0), 0);
        const pago = monthPedidos
          .filter(p => p.status_pagamento === 'pago')
          .reduce((acc, p) => acc + (p.valor_total || 0), 0);

        return {
          name: format(monthStart, 'MMM', { locale: ptBR }),
          total,
          pago,
          pendente: total - pago,
        };
      });
    } else {
      // Last 5 years
      const currentYear = now.getFullYear();
      const years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);

      return years.map(year => {
        const yearStart = startOfYear(new Date(year, 0, 1));
        const yearEnd = endOfYear(new Date(year, 0, 1));
        const yearPedidos = pedidos.filter(p => {
          const pedidoDate = new Date(p.data_hora_entrega);
          return isWithinInterval(pedidoDate, { start: yearStart, end: yearEnd });
        });

        const total = yearPedidos.reduce((acc, p) => acc + (p.valor_total || 0), 0);
        const pago = yearPedidos
          .filter(p => p.status_pagamento === 'pago')
          .reduce((acc, p) => acc + (p.valor_total || 0), 0);

        return {
          name: year.toString(),
          total,
          pago,
          pendente: total - pago,
        };
      });
    }
  }, [pedidos, viewPeriod]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Financeiro
        </h1>
        <p className="text-muted-foreground">Visão financeira completa do negócio</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">A Receber</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{formatCurrency(totalPendente)}</div>
            <p className="text-xs text-muted-foreground mt-1">{pedidosPendentes.length} pedidos pendentes</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recebido</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(totalPago)}</div>
            <p className="text-xs text-muted-foreground mt-1">{pedidosPagos.length} pedidos pagos</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-info">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Com Nota Fiscal</CardTitle>
            <FileText className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{formatCurrency(totalComNota)}</div>
            <p className="text-xs text-muted-foreground mt-1">{pedidosComNota.length} pedidos</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-muted">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sem Nota Fiscal</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSemNota)}</div>
            <p className="text-xs text-muted-foreground mt-1">{pedidosSemNota.length} pedidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Vendas por Período</CardTitle>
            <Select value={viewPeriod} onValueChange={(v: ViewPeriod) => setViewPeriod(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Semanal</SelectItem>
                <SelectItem value="month">Mensal</SelectItem>
                <SelectItem value="year">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="pago" name="Pago" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pendente" name="Pendente" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-success" />
              <span className="text-sm text-muted-foreground">Pago</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-warning" />
              <span className="text-sm text-muted-foreground">Pendente</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs with orders lists */}
      <Tabs defaultValue="pendentes">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pendentes" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Pendentes</span>
            <Badge variant="secondary" className="ml-1">{pedidosPendentes.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pagos" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Pagos</span>
            <Badge variant="secondary" className="ml-1">{pedidosPagos.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="comNota" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Com NF</span>
            <Badge variant="secondary" className="ml-1">{pedidosComNota.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="semNota" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Sem NF</span>
            <Badge variant="secondary" className="ml-1">{pedidosSemNota.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                Pedidos com Pagamento Pendente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {pedidosPendentes.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum pedido com pagamento pendente
                    </p>
                  ) : (
                    pedidosPendentes
                      .sort((a, b) => new Date(a.data_hora_entrega).getTime() - new Date(b.data_hora_entrega).getTime())
                      .map(pedido => (
                      <div key={pedido.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="space-y-1">
                          <p className="font-medium">{pedido.cliente?.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(pedido.data_hora_entrega), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-warning">{formatCurrency(pedido.valor_total)}</p>
                          <Badge variant="outline" className="bg-warning/20 text-warning-foreground">
                            {pedido.status === 'executado' ? 'Executado' : 'Pendente'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagos">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                Pedidos Pagos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {pedidosPagos.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum pedido pago
                    </p>
                  ) : (
                    pedidosPagos
                      .sort((a, b) => new Date(b.paid_at || b.created_at).getTime() - new Date(a.paid_at || a.created_at).getTime())
                      .map(pedido => (
                      <div key={pedido.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="space-y-1">
                          <p className="font-medium">{pedido.cliente?.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(pedido.data_hora_entrega), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-success">{formatCurrency(pedido.valor_total)}</p>
                          <Badge variant="outline" className="bg-success/20 text-success-foreground">
                            Pago
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comNota">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-info" />
                Pedidos com Nota Fiscal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {pedidosComNota.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum pedido com nota fiscal
                    </p>
                  ) : (
                    pedidosComNota
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map(pedido => (
                      <div key={pedido.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="space-y-1">
                          <p className="font-medium">{pedido.cliente?.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(pedido.data_hora_entrega), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(pedido.valor_total)}</p>
                          <Badge variant="outline" className={
                            pedido.status_pagamento === 'pago' 
                              ? 'bg-success/20 text-success-foreground' 
                              : 'bg-warning/20 text-warning-foreground'
                          }>
                            {pedido.status_pagamento === 'pago' ? 'Pago' : 'Pendente'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="semNota">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-5 w-5 text-muted-foreground" />
                Pedidos sem Nota Fiscal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {pedidosSemNota.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum pedido sem nota fiscal
                    </p>
                  ) : (
                    pedidosSemNota
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map(pedido => (
                      <div key={pedido.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="space-y-1">
                          <p className="font-medium">{pedido.cliente?.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(pedido.data_hora_entrega), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(pedido.valor_total)}</p>
                          <Badge variant="outline" className={
                            pedido.status_pagamento === 'pago' 
                              ? 'bg-success/20 text-success-foreground' 
                              : 'bg-warning/20 text-warning-foreground'
                          }>
                            {pedido.status_pagamento === 'pago' ? 'Pago' : 'Pendente'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}