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
  isToday
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock,
  User,
  Plus,
  Pencil
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Pedido, StatusPedido } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { PedidoFormDialog } from '@/components/pedidos/PedidoFormDialog';

interface CalendarioWidgetProps {
  pedidos: Pedido[];
  isLoading?: boolean;
}

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

export function CalendarioWidget({ pedidos, isLoading }: CalendarioWidgetProps) {
  const { isAdmin } = useAuth();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);

  // Get days for the current month view
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

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
    setCurrentDate(subMonths(currentDate, 1));
  };

  const navigateNext = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayPedidos = pedidosByDate[dateKey] || [];
    
    if (dayPedidos.length === 0) {
      setSelectedPedido(null);
      setFormDialogOpen(true);
    } else if (dayPedidos.length === 1) {
      setSelectedPedido(dayPedidos[0]);
      setFormDialogOpen(true);
    } else {
      setDialogOpen(true);
    }
  };

  const handleEditPedido = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setDialogOpen(false);
    setFormDialogOpen(true);
  };

  const handleCreateFromDialog = () => {
    setSelectedPedido(null);
    setDialogOpen(false);
    setFormDialogOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <>
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
            
            <CardTitle className="text-lg">
              {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
            </CardTitle>
            
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-warning" />
                <span className="text-muted-foreground">Pendente</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-muted-foreground">Executado</span>
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
                className="text-center text-xs font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
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
                    "min-h-[70px] p-1 border rounded-lg cursor-pointer transition-colors",
                    !isCurrentMonth && "bg-muted/30 opacity-50",
                    isToday(day) && "border-primary border-2",
                    isSelected && "ring-2 ring-primary",
                    dayPedidos.length > 0 && "hover:bg-accent/50",
                    "hover:border-primary/50"
                  )}
                >
                  <div className={cn(
                    "text-xs font-medium mb-1",
                    isToday(day) && "text-primary",
                    !isCurrentMonth && "text-muted-foreground"
                  )}>
                    {format(day, 'd')}
                  </div>
                  
                  {/* Pedidos indicators */}
                  <div className="space-y-0.5">
                    {dayPedidos.slice(0, 2).map((pedido) => (
                      <div
                        key={pedido.id}
                        className={cn(
                          "text-[10px] px-1 py-0.5 rounded truncate border-l-2",
                          statusColors[pedido.status]
                        )}
                      >
                        {format(new Date(pedido.data_hora_entrega), 'HH:mm')}
                      </div>
                    ))}
                    {dayPedidos.length > 2 && (
                      <div className="text-[10px] text-muted-foreground text-center">
                        +{dayPedidos.length - 2}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                {selectedDate && format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </div>
              <Button variant="outline" size="sm" onClick={handleCreateFromDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Pedido
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 pr-4">
              {selectedDatePedidos
                .sort((a, b) => new Date(a.data_hora_entrega).getTime() - new Date(b.data_hora_entrega).getTime())
                .map((pedido) => (
                <div
                  key={pedido.id}
                  className={cn(
                    "p-4 rounded-lg border-l-4 cursor-pointer hover:bg-accent/50 transition-colors",
                    statusColors[pedido.status],
                    "bg-card"
                  )}
                  onClick={() => handleEditPedido(pedido)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
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
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      {isAdmin && (
                        <p className="font-semibold text-primary">
                          {formatCurrency(pedido.valor_total)}
                        </p>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Pedido Form Dialog */}
      <PedidoFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        pedido={selectedPedido}
        initialDate={selectedDate || undefined}
      />
    </>
  );
}