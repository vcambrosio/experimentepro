import { useState, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isToday
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock,
  User,
  Loader2
} from 'lucide-react';
import { usePedidos } from '@/hooks/usePedidos';
import { useAuth } from '@/contexts/AuthContext';
import { Pedido, StatusPedido } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type ViewMode = 'month' | 'week';

const statusColors: Record<StatusPedido, string> = {
  pendente: 'bg-warning border-warning',
  executado: 'bg-success border-success',
  cancelado: 'bg-destructive border-destructive',
};

const statusLabels: Record<StatusPedido, string> = {
  pendente: 'Pendente',
  executado: 'Executado',
  cancelado: 'Cancelado',
};

export default function Calendario() {
  const { isAdmin } = useAuth();
  const { data: pedidos, isLoading } = usePedidos();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Get days for the current view
  const days = useMemo(() => {
    if (viewMode === 'month') {
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
      const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    }
  }, [currentDate, viewMode]);

  // Group pedidos by date
  const pedidosByDate = useMemo(() => {
    const grouped: Record<string, Pedido[]> = {};
    pedidos?.forEach(pedido => {
      const dateKey = format(new Date(pedido.data_hora_entrega), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(pedido);
    });
    return grouped;
  }, [pedidos]);

  // Get pedidos for selected date
  const selectedDatePedidos = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return pedidosByDate[dateKey] || [];
  }, [selectedDate, pedidosByDate]);

  const navigatePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    const dateKey = format(day, 'yyyy-MM-dd');
    if (pedidosByDate[dateKey]?.length > 0) {
      setDialogOpen(true);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Calendário</h1>
          <p className="text-muted-foreground">Visualize suas entregas programadas</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mensal</SelectItem>
              <SelectItem value="week">Semanal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={navigatePrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Hoje
              </Button>
            </div>
            
            <CardTitle className="text-xl">
              {viewMode === 'month' 
                ? format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })
                : `Semana de ${format(startOfWeek(currentDate, { weekStartsOn: 0 }), "dd 'de' MMMM", { locale: ptBR })}`
              }
            </CardTitle>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-warning" />
                <span className="text-muted-foreground">Pendente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-muted-foreground">Executado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span className="text-muted-foreground">Cancelado</span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Week days header */}
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className={cn(
            "grid grid-cols-7 gap-1",
            viewMode === 'week' ? 'min-h-[400px]' : ''
          )}>
            {days.map((day, index) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayPedidos = pedidosByDate[dateKey] || [];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              
              return (
                <div
                  key={index}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "min-h-[100px] p-2 border rounded-lg cursor-pointer transition-colors",
                    !isCurrentMonth && viewMode === 'month' && "bg-muted/30 opacity-50",
                    isToday(day) && "border-primary border-2",
                    isSelected && "ring-2 ring-primary",
                    dayPedidos.length > 0 && "hover:bg-accent/50",
                    "hover:border-primary/50"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    isToday(day) && "text-primary",
                    !isCurrentMonth && viewMode === 'month' && "text-muted-foreground"
                  )}>
                    {format(day, 'd')}
                  </div>
                  
                  {/* Pedidos indicators */}
                  <div className="space-y-1">
                    {dayPedidos.slice(0, viewMode === 'week' ? 5 : 3).map((pedido) => (
                      <div
                        key={pedido.id}
                        className={cn(
                          "text-xs p-1 rounded truncate border-l-2",
                          statusColors[pedido.status]
                        )}
                      >
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {format(new Date(pedido.data_hora_entrega), 'HH:mm')} - {pedido.cliente?.nome}
                          </span>
                        </div>
                      </div>
                    ))}
                    {dayPedidos.length > (viewMode === 'week' ? 5 : 3) && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{dayPedidos.length - (viewMode === 'week' ? 5 : 3)} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Entregas Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {pedidosByDate[format(new Date(), 'yyyy-MM-dd')]?.length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes Este Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning-foreground">
              {pedidos?.filter(p => 
                p.status === 'pendente' && 
                isSameMonth(new Date(p.data_hora_entrega), currentDate)
              ).length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Este Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pedidos?.filter(p => 
                isSameMonth(new Date(p.data_hora_entrega), currentDate)
              ).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Day Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              {selectedDate && format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 pr-4">
              {selectedDatePedidos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma entrega programada
                </p>
              ) : (
                selectedDatePedidos
                  .sort((a, b) => new Date(a.data_hora_entrega).getTime() - new Date(b.data_hora_entrega).getTime())
                  .map((pedido) => (
                  <div
                    key={pedido.id}
                    className={cn(
                      "p-4 rounded-lg border-l-4",
                      statusColors[pedido.status],
                      "bg-card"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(new Date(pedido.data_hora_entrega), 'HH:mm')}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {statusLabels[pedido.status]}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{pedido.cliente?.nome}</span>
                        </div>
                        
                        {pedido.setor && (
                          <p className="text-xs text-muted-foreground ml-6">
                            {pedido.setor.nome_setor}
                          </p>
                        )}
                      </div>
                      
                      {isAdmin && (
                        <div className="text-right">
                          <p className="font-semibold text-primary">
                            {formatCurrency(pedido.valor_total)}
                          </p>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              pedido.status_pagamento === 'pago' 
                                ? 'bg-success/20 text-success-foreground' 
                                : 'bg-warning/20 text-warning-foreground'
                            )}
                          >
                            {pedido.status_pagamento === 'pago' ? 'Pago' : 'A Pagar'}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}