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
  subMonths,
  parseISO,
  isValid
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DollarSign,
  Clock,
  CheckCircle,
  FileText,
  TrendingUp,
  AlertCircle,
  Receipt,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  Filter,
  Trash2,
  Edit,
  PieChart,
  Store
} from 'lucide-react';
import { usePedidos } from '@/hooks/usePedidos';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { LancamentoFormDialog } from '@/components/financeiro/LancamentoFormDialog';
import { 
  useLancamentosFinanceiros, 
  useCreateLancamento, 
  useUpdateLancamento, 
  useDeleteLancamento,
  useResumoFinanceiro,
  useFluxoCaixa,
  useBalanco
} from '@/hooks/useFinanceiro';
import type { LancamentoFinanceiro, TipoFinanceiro, StatusLancamento } from '@/types';
import { toast } from 'sonner';

type ViewPeriod = 'week' | 'month' | 'year';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function Financeiro() {
  const { isAdmin } = useAuth();
  const { data: pedidos, isLoading: isLoadingPedidos } = usePedidos();
  
  // Estado para lançamentos
  const [lancamentoDialogOpen, setLancamentoDialogOpen] = useState(false);
  const [editingLancamento, setEditingLancamento] = useState<LancamentoFinanceiro | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lancamentoToDelete, setLancamentoToDelete] = useState<string | null>(null);
  
  // Filtros
  const [viewPeriod, setViewPeriod] = useState<ViewPeriod>('month');
  const [filtroTipo, setFiltroTipo] = useState<TipoFinanceiro | 'todos'>('todos');
  const [filtroStatus, setFiltroStatus] = useState<StatusLancamento | 'todos'>('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  
  // Hooks para lançamentos
  const { data: lancamentos, isLoading: isLoadingLancamentos } = useLancamentosFinanceiros(
    filtroTipo === 'todos' ? undefined : filtroTipo,
    filtroStatus === 'todos' ? undefined : filtroStatus,
    dataInicio || undefined,
    dataFim || undefined
  );
  
  const { data: resumo } = useResumoFinanceiro(dataInicio || undefined, dataFim || undefined);
  
  const { data: fluxoCaixa } = useFluxoCaixa(
    dataInicio || startOfMonth(new Date()).toISOString().split('T')[0],
    dataFim || endOfMonth(new Date()).toISOString().split('T')[0]
  );
  
  const { data: balanco } = useBalanco(
    dataInicio || startOfMonth(new Date()).toISOString().split('T')[0],
    dataFim || endOfMonth(new Date()).toISOString().split('T')[0]
  );
  
  const createLancamento = useCreateLancamento();
  const updateLancamento = useUpdateLancamento();
  const deleteLancamento = useDeleteLancamento();

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

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (!isValid(date)) return dateString;
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  // Handlers
  const handleCreateLancamento = async (lancamento: Omit<LancamentoFinanceiro, 'id' | 'created_at' | 'updated_at' | 'categoria' | 'pedido'>) => {
    try {
      await createLancamento.mutateAsync(lancamento);
      toast.success('Lançamento criado com sucesso!');
      setLancamentoDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao criar lançamento');
      console.error(error);
    }
  };

  const handleUpdateLancamento = async (lancamento: Omit<LancamentoFinanceiro, 'id' | 'created_at' | 'updated_at' | 'categoria' | 'pedido'>) => {
    if (!editingLancamento) return;
    try {
      await updateLancamento.mutateAsync({ id: editingLancamento.id, ...lancamento });
      toast.success('Lançamento atualizado com sucesso!');
      setLancamentoDialogOpen(false);
      setEditingLancamento(undefined);
    } catch (error) {
      toast.error('Erro ao atualizar lançamento');
      console.error(error);
    }
  };

  const handleDeleteLancamento = async () => {
    if (!lancamentoToDelete) return;
    try {
      await deleteLancamento.mutateAsync(lancamentoToDelete);
      toast.success('Lançamento excluído com sucesso!');
      setDeleteDialogOpen(false);
      setLancamentoToDelete(null);
    } catch (error) {
      toast.error('Erro ao excluir lançamento');
      console.error(error);
    }
  };

  const openEditDialog = (lancamento: LancamentoFinanceiro) => {
    setEditingLancamento(lancamento);
    setLancamentoDialogOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setLancamentoToDelete(id);
    setDeleteDialogOpen(true);
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

  // Calculate totals from pedidos
  const totalPendentePedidos = pedidosPendentes.reduce((acc, p) => acc + (p.valor_total || 0), 0);
  const totalPagoPedidos = pedidosPagos.reduce((acc, p) => acc + (p.valor_total || 0), 0);

  // Filter vendas loja (same logic as VendaLoja page)
  const vendasLoja = useMemo(() =>
    pedidos?.filter(pedido => {
      const dataCriacao = new Date(pedido.created_at);
      const dataEntrega = pedido.data_hora_entrega ? new Date(pedido.data_hora_entrega) : null;
      return (
        dataEntrega !== null &&
        dataCriacao.toDateString() === dataEntrega.toDateString() &&
        pedido.status === 'executado'
      );
    }) || [],
    [pedidos]
  );

  const vendasLojaPendentes = vendasLoja.filter(p => p.status_pagamento === 'pendente');
  const totalPendenteVendaLoja = vendasLojaPendentes.reduce((acc, p) => acc + (p.valor_total || 0), 0);

  // Generate chart data based on period
  const chartData = useMemo(() => {
    if (!lancamentos || lancamentos.length === 0) return [];

    const now = new Date();
    
    if (viewPeriod === 'week') {
      const weeks = eachWeekOfInterval({
        start: subMonths(now, 2),
        end: now,
      }, { weekStartsOn: 0 });

      return weeks.map(weekStart => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
        const weekLancamentos = lancamentos.filter(l => {
          const lancamentoDate = parseISO(l.data_lancamento);
          return isValid(lancamentoDate) && isWithinInterval(lancamentoDate, { start: weekStart, end: weekEnd });
        });

        const receitas = weekLancamentos
          .filter(l => l.tipo === 'receita')
          .reduce((acc, l) => acc + l.valor, 0);
        const despesas = weekLancamentos
          .filter(l => l.tipo === 'despesa')
          .reduce((acc, l) => acc + l.valor, 0);

        return {
          name: format(weekStart, "'Sem' w", { locale: ptBR }),
          receitas,
          despesas,
          saldo: receitas - despesas,
        };
      });
    } else if (viewPeriod === 'month') {
      const months = eachMonthOfInterval({
        start: subMonths(now, 11),
        end: now,
      });

      return months.map(monthStart => {
        const monthEnd = endOfMonth(monthStart);
        const monthLancamentos = lancamentos.filter(l => {
          const lancamentoDate = parseISO(l.data_lancamento);
          return isValid(lancamentoDate) && isWithinInterval(lancamentoDate, { start: monthStart, end: monthEnd });
        });

        const receitas = monthLancamentos
          .filter(l => l.tipo === 'receita')
          .reduce((acc, l) => acc + l.valor, 0);
        const despesas = monthLancamentos
          .filter(l => l.tipo === 'despesa')
          .reduce((acc, l) => acc + l.valor, 0);

        return {
          name: format(monthStart, 'MMM', { locale: ptBR }),
          receitas,
          despesas,
          saldo: receitas - despesas,
        };
      });
    } else {
      const currentYear = now.getFullYear();
      const years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);

      return years.map(year => {
        const yearStart = startOfYear(new Date(year, 0, 1));
        const yearEnd = endOfYear(new Date(year, 0, 1));
        const yearLancamentos = lancamentos.filter(l => {
          const lancamentoDate = parseISO(l.data_lancamento);
          return isValid(lancamentoDate) && isWithinInterval(lancamentoDate, { start: yearStart, end: yearEnd });
        });

        const receitas = yearLancamentos
          .filter(l => l.tipo === 'receita')
          .reduce((acc, l) => acc + l.valor, 0);
        const despesas = yearLancamentos
          .filter(l => l.tipo === 'despesa')
          .reduce((acc, l) => acc + l.valor, 0);

        return {
          name: year.toString(),
          receitas,
          despesas,
          saldo: receitas - despesas,
        };
      });
    }
  }, [lancamentos, viewPeriod]);

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

  const isLoading = isLoadingPedidos || isLoadingLancamentos;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Financeiro
          </h1>
          <p className="text-muted-foreground">Visão financeira completa do negócio</p>
        </div>
        <Button onClick={() => {
          setEditingLancamento(undefined);
          setLancamentoDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Lançamento
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Receitas</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(resumo?.totalReceitas || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {resumo?.receitasRealizadas || 0} realizadas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Despesas</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(resumo?.totalDespesas || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {resumo?.despesasRealizadas || 0} realizadas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Atual</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(resumo?.saldo || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(resumo?.saldo || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(resumo?.saldoRealizado || 0)} realizado
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">A Receber (Pedidos de Evento ou Cesta)</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{formatCurrency(totalPendentePedidos)}</div>
            <p className="text-xs text-muted-foreground mt-1">{pedidosPendentes.length} pedidos de evento ou cesta pendentes</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-info">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">A Receber (Venda Loja)</CardTitle>
            <Store className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{formatCurrency(totalPendenteVendaLoja)}</div>
            <p className="text-xs text-muted-foreground mt-1">{vendasLojaPendentes.length} vendas de loja pendentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data Início</Label>
              <Input
                id="data_inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_fim">Data Fim</Label>
              <Input
                id="data_fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filtro_tipo">Tipo</Label>
              <Select value={filtroTipo} onValueChange={(value: TipoFinanceiro | 'todos') => setFiltroTipo(value)}>
                <SelectTrigger id="filtro_tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="receita">Receitas</SelectItem>
                  <SelectItem value="despesa">Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filtro_status">Status</Label>
              <Select value={filtroStatus} onValueChange={(value: StatusLancamento | 'todos') => setFiltroStatus(value)}>
                <SelectTrigger id="filtro_status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="realizado">Realizado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="visao_geral" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="visao_geral" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="lancamentos" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Lançamentos</span>
          </TabsTrigger>
          <TabsTrigger value="fluxo_caixa" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Fluxo de Caixa</span>
          </TabsTrigger>
          <TabsTrigger value="balanco" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">Balanço</span>
          </TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="visao_geral" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Receitas vs Despesas por Período</CardTitle>
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
                    <Bar dataKey="receitas" name="Receitas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-success" />
                  <span className="text-sm text-muted-foreground">Receitas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-destructive" />
                  <span className="text-sm text-muted-foreground">Despesas</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lançamentos */}
        <TabsContent value="lancamentos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Lançamentos Financeiros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {!lancamentos || lancamentos.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum lançamento encontrado
                    </p>
                  ) : (
                    lancamentos.map(lancamento => (
                      <div key={lancamento.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            {lancamento.tipo === 'receita' ? (
                              <ArrowUpCircle className="h-4 w-4 text-success" />
                            ) : (
                              <ArrowDownCircle className="h-4 w-4 text-destructive" />
                            )}
                            <p className="font-medium">{lancamento.descricao}</p>
                            <Badge variant="outline" className={
                              lancamento.status === 'realizado' 
                                ? 'bg-success/20 text-success-foreground' 
                                : lancamento.status === 'cancelado'
                                ? 'bg-destructive/20 text-destructive-foreground'
                                : 'bg-warning/20 text-warning-foreground'
                            }>
                              {lancamento.status}
                            </Badge>
                            {lancamento.recorrente && (
                              <Badge variant="outline" className="bg-info/20 text-info-foreground">
                                Recorrente
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {lancamento.categoria?.nome} • {formatDate(lancamento.data_lancamento)}
                            {lancamento.data_pagamento && ` • Pago em ${formatDate(lancamento.data_pagamento)}`}
                          </p>
                          {lancamento.observacoes && (
                            <p className="text-xs text-muted-foreground">{lancamento.observacoes}</p>
                          )}
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <div>
                            <p className={`font-semibold ${lancamento.tipo === 'receita' ? 'text-success' : 'text-destructive'}`}>
                              {lancamento.tipo === 'receita' ? '+' : '-'}{formatCurrency(lancamento.valor)}
                            </p>
                            {lancamento.forma_pagamento && (
                              <p className="text-xs text-muted-foreground">{lancamento.forma_pagamento}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(lancamento)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(lancamento.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fluxo de Caixa */}
        <TabsContent value="fluxo_caixa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Fluxo de Caixa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fluxoCaixa}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="data" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => format(parseISO(value), 'dd/MM', { locale: ptBR })}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="saldo" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Saldo"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="saldo_realizado" 
                      stroke="hsl(var(--success))" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Saldo Realizado"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Balanço */}
        <TabsContent value="balanco" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-success" />
                  Receitas por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={balanco?.receitasPorCategoria || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ categoria, porcentagem }) => `${categoria} (${porcentagem.toFixed(1)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="valor"
                      >
                        {(balanco?.receitasPorCategoria || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-destructive" />
                  Despesas por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={balanco?.despesasPorCategoria || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ categoria, porcentagem }) => `${categoria} (${porcentagem.toFixed(1)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="valor"
                      >
                        {(balanco?.despesasPorCategoria || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumo do Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Receitas</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(balanco?.totalReceitas || 0)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Despesas</p>
                  <p className="text-2xl font-bold text-destructive">{formatCurrency(balanco?.totalDespesas || 0)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Lucro/Prejuízo</p>
                  <p className={`text-2xl font-bold ${(balanco?.lucro || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(balanco?.lucro || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <LancamentoFormDialog
        open={lancamentoDialogOpen}
        onOpenChange={setLancamentoDialogOpen}
        onSubmit={editingLancamento ? handleUpdateLancamento : handleCreateLancamento}
        lancamento={editingLancamento}
        isLoading={createLancamento.isPending || updateLancamento.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLancamento}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
