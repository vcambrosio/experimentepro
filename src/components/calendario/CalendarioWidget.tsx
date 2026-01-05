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
  isToday,
  setHours,
  setMinutes,
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Plus,
  Pencil,
  Loader2,
  GripVertical,
  Move,
  ShoppingBasket,
  Coffee,
  Package
} from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdatePedido } from '@/hooks/usePedidos';
import { Pedido, StatusPedido } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { PedidoFormDialog } from '@/components/pedidos/PedidoFormDialog';
import { toast } from 'sonner';
 
type ViewMode = 'month' | 'week';
 
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

// Função para obter cor e ícone baseado na categoria
const getCategoriaInfo = (pedido: Pedido) => {
  if (!pedido.itens || pedido.itens.length === 0) {
    return {
      color: 'bg-gray-100 border-gray-300',
      icon: Package,
      label: 'Sem categoria'
    };
  }
  
  const categoriaNome = pedido.itens[0].categoria?.nome?.toLowerCase() || '';
  
  // Cestas - Rosa
  if (categoriaNome.includes('cesta') || categoriaNome.includes('basket')) {
    return {
      color: 'bg-pink-100 border-pink-300 text-pink-700',
      icon: ShoppingBasket,
      label: 'Cestas'
    };
  }
  
  // Coffee break - Azul
  if (categoriaNome.includes('coffee') || categoriaNome.includes('café') || categoriaNome.includes('cafe')) {
    return {
      color: 'bg-blue-100 border-blue-300 text-blue-700',
      icon: Coffee,
      label: 'Coffee Break'
    };
  }
  
  // Outros - Cinza
  return {
    color: 'bg-gray-100 border-gray-300 text-gray-700',
    icon: Package,
    label: 'Outros'
  };
};
 
// Draggable Pedido Component
function DraggablePedido({ pedido, viewMode }: { pedido: Pedido; viewMode: ViewMode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: pedido.id,
    data: { pedido },
  });
 
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };
  
  const categoriaInfo = getCategoriaInfo(pedido);
  const CategoriaIcon = categoriaInfo.icon;
 
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "text-[10px] px-1 py-0.5 rounded truncate border-l-2 cursor-grab active:cursor-grabbing flex items-center gap-0.5",
        categoriaInfo.color
      )}
      {...listeners}
      {...attributes}
    >
      <GripVertical className="h-2 w-2 shrink-0 opacity-50" />
      <CategoriaIcon className="h-2.5 w-2.5 shrink-0" />
      <span className="hidden sm:inline truncate">
        {format(new Date(pedido.data_hora_entrega), 'HH:mm')} - {pedido.cliente?.nome ? pedido.cliente.nome.split(' ')[0] : ''}{pedido.setor ? ` - ${pedido.setor.nome_setor}` : ''}
      </span>
      <span className="sm:hidden">
        {format(new Date(pedido.data_hora_entrega), 'HH:mm')}
      </span>
    </div>
  );
}
 
// Droppable Day Cell
function DroppableDay({ 
  day, 
  isCurrentMonth, 
  isSelected, 
  viewMode,
  pedidos,
  onDayClick,
  children 
}: { 
  day: Date;
  isCurrentMonth: boolean;
  isSelected: boolean;
  viewMode: ViewMode;
  pedidos: Pedido[];
  onDayClick: () => void;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: format(day, 'yyyy-MM-dd'),
    data: { day },
  });
 
  return (
    <div
      ref={setNodeRef}
      onClick={onDayClick}
      className={cn(
        "min-h-[80px] p-1 border rounded-lg cursor-pointer transition-colors",
        !isCurrentMonth && viewMode === 'month' && "bg-muted/30 opacity-50",
        isToday(day) && "border-primary border-2",
        isSelected && "ring-2 ring-primary",
        pedidos.length > 0 && "hover:bg-accent/50",
        isOver && "bg-primary/20 border-primary border-2",
        "hover:border-primary/50"
      )}
    >
      {children}
    </div>
  );
}
 
export function CalendarioWidget({ pedidos, isLoading }: CalendarioWidgetProps) {
  const { isAdmin } = useAuth();
  const updatePedido = useUpdatePedido();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  
  // Drag and drop state
  const [activeDragPedido, setActiveDragPedido] = useState<Pedido | null>(null);
  const [rescheduleDialog, setRescheduleDialog] = useState<{
    open: boolean;
    pedido: Pedido | null;
    newDate: Date | null;
    newTime: string;
  }>({ open: false, pedido: null, newDate: null, newTime: '12:00' });
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
 
  // Get days for current view
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
 
  // Group pedidos by date and sort by time
  const pedidosByDate = useMemo(() => {
    const grouped: Record<string, Pedido[]> = {};
    pedidos?.forEach(pedido => {
      const dateKey = format(new Date(pedido.data_hora_entrega), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(pedido);
    });
    
    // Sort pedidos in each day by time
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) =>
        new Date(a.data_hora_entrega).getTime() - new Date(b.data_hora_entrega).getTime()
      );
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
    const dayPedidos = pedidosByDate[dateKey] || [];
    
    // Sempre abre o diálogo de detalhes se houver pedidos
    // Isso permite que o usuário escolha entre criar novo ou editar existente
    if (dayPedidos.length === 0) {
      setSelectedPedido(null);
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
 
  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const pedido = pedidos.find(p => p.id === active.id);
    if (pedido) {
      setActiveDragPedido(pedido);
    }
  };
 
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragPedido(null);
    
    if (!over) return;
    
    const pedidoId = active.id as string;
    const newDateKey = over.id as string;
    const pedido = pedidos.find(p => p.id === pedidoId);
    
    if (!pedido) return;
    
    const currentDateKey = format(new Date(pedido.data_hora_entrega), 'yyyy-MM-dd');
    
    // Only show dialog if dropping on a different day
    if (currentDateKey !== newDateKey) {
      // Use parseISO to avoid timezone issues
      const newDate = parseISO(newDateKey);
      const currentTime = format(new Date(pedido.data_hora_entrega), 'HH:mm');
      
      setRescheduleDialog({
        open: true,
        pedido,
        newDate,
        newTime: currentTime,
      });
      
      // Automatically navigate to new date
      setCurrentDate(newDate);
    }
  };
 
  const confirmReschedule = async () => {
    if (!rescheduleDialog.pedido || !rescheduleDialog.newDate) return;
    
    const [hours, minutes] = rescheduleDialog.newTime.split(':').map(Number);
    const newDateTime = setMinutes(setHours(rescheduleDialog.newDate, hours), minutes);
 
    try {
      await updatePedido.mutateAsync({
        id: rescheduleDialog.pedido.id,
        data_hora_entrega: newDateTime.toISOString(),
      });
      
      setRescheduleDialog({ open: false, pedido: null, newDate: null, newTime: '12:00' });
    } catch (error) {
      console.error('Error rescheduling:', error);
    }
  };
 
  const openEditAfterReschedule = async () => {
    if (!rescheduleDialog.pedido || !rescheduleDialog.newDate) return;
    
    const [hours, minutes] = rescheduleDialog.newTime.split(':').map(Number);
    const newDateTime = setMinutes(setHours(rescheduleDialog.newDate, hours), minutes);
 
    try {
      await updatePedido.mutateAsync({
        id: rescheduleDialog.pedido.id,
        data_hora_entrega: newDateTime.toISOString(),
      });
      
      // Open edit dialog
      setSelectedPedido(rescheduleDialog.pedido);
      setSelectedDate(rescheduleDialog.newDate);
      setRescheduleDialog({ open: false, pedido: null, newDate: null, newTime: '12:00' });
      setFormDialogOpen(true);
    } catch (error) {
      console.error('Error rescheduling:', error);
    }
  };
 
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };
 
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
 
  // Summary stats
  const entregasHoje = pedidosByDate[format(new Date(), 'yyyy-MM-dd')]?.length || 0;
  const pendentesEsteMes = pedidos?.filter(p => 
    p.status === 'pendente' && 
    isSameMonth(new Date(p.data_hora_entrega), currentDate)
  ).length || 0;
  const totalEsteMes = pedidos?.filter(p => 
    isSameMonth(new Date(p.data_hora_entrega), currentDate)
  ).length || 0;
 
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
 
  return (
    <>
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
              {entregasHoje}
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
              {pendentesEsteMes}
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
              {totalEsteMes}
            </div>
          </CardContent>
        </Card>
      </div>
 
      {/* Calendar */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
           
            <CardTitle className="text-lg text-center">
              {viewMode === 'month' 
                ? format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })
                : `Semana de ${format(startOfWeek(currentDate, { weekStartsOn: 0 }), "dd 'de' MMMM", { locale: ptBR })}`}
            </CardTitle>
           
            <div className="flex items-center gap-2">
              <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Mensal</SelectItem>
                  <SelectItem value="week">Semanal</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="hidden md:flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <Move className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Arraste para reagendar</span>
                </div>
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
 
          {/* Calendar grid with DnD */}
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className={cn(
              "grid grid-cols-7 gap-1",
              viewMode === 'week' ? 'min-h-[300px]' : ''
            )}>
              {days.map((day, index) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayPedidos = pedidosByDate[dateKey] || [];
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                 
                return (
                  <DroppableDay
                    key={index}
                    day={day}
                    isCurrentMonth={isCurrentMonth}
                    isSelected={isSelected}
                    viewMode={viewMode}
                    pedidos={dayPedidos}
                    onDayClick={() => handleDayClick(day)}
                  >
                    <div className={cn(
                      "text-xs font-medium mb-1",
                      isToday(day) && "text-primary",
                      !isCurrentMonth && viewMode === 'month' && "text-muted-foreground"
                    )}>
                      {format(day, 'd')}
                    </div>
                     
                    {/* Pedidos indicators */}
                    <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
                      {dayPedidos.slice(0, viewMode === 'week' ? 4 : 2).map((pedido) => (
                        <DraggablePedido key={pedido.id} pedido={pedido} viewMode={viewMode} />
                      ))}
                      {dayPedidos.length > (viewMode === 'week' ? 4 : 2) && (
                        <div className="text-[10px] text-muted-foreground text-center">
                          +{dayPedidos.length - (viewMode === 'week' ? 4 : 2)}
                        </div>
                      )}
                    </div>
                  </DroppableDay>
                );
              })}
            </div>
 
            {/* Drag Overlay */}
            <DragOverlay>
              {activeDragPedido && (
                <div className={cn(
                  "text-[10px] px-2 py-1 rounded border-l-2 shadow-lg bg-card",
                  statusColors[activeDragPedido.status]
                )}>
                  <div className="font-medium">
                    {format(new Date(activeDragPedido.data_hora_entrega), 'HH:mm')} - {activeDragPedido.cliente?.nome || ''}
                  </div>
                </div>
              )}
            </DragOverlay>
          </DndContext>
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
                Novo Pedido de Evento ou Cesta
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 pr-4">
              {selectedDatePedidos
                .sort((a, b) => new Date(a.data_hora_entrega).getTime() - new Date(b.data_hora_entrega).getTime())
                .map((pedido) => {
                  const categoriaInfo = getCategoriaInfo(pedido);
                  const CategoriaIcon = categoriaInfo.icon;
                  
                  return (
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
                            <Badge variant="outline" className={cn("text-xs", categoriaInfo.color)}>
                              <CategoriaIcon className="h-3 w-3 mr-1" />
                              {categoriaInfo.label}
                            </Badge>
                          </div>
                         
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{pedido.cliente?.nome || ''}</span>
                          </div>
                         
                          {pedido.setor && (
                            <p className="text-xs text-muted-foreground ml-6">
                              {pedido.setor.nome_setor}
                            </p>
                          )}
                        </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        {isAdmin && (
                          <>
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
                          </>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
 
      {/* Reschedule Confirmation Dialog */}
      <Dialog open={rescheduleDialog.open} onOpenChange={(open) => setRescheduleDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Move className="h-5 w-5 text-primary" />
              Reagendar Pedido de Evento ou Cesta
            </DialogTitle>
            <DialogDescription>
              Confirme a nova data e horário para o pedido de evento ou cesta de <strong>{rescheduleDialog.pedido?.cliente?.nome}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nova Data</Label>
              <div className="p-3 bg-muted rounded-lg font-medium">
                {rescheduleDialog.newDate && format(rescheduleDialog.newDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </div>
            </div>
           
            <div className="space-y-2">
              <Label htmlFor="newTime">Novo Horário</Label>
              <Input
                id="newTime"
                type="time"
                value={rescheduleDialog.newTime}
                onChange={(e) => setRescheduleDialog(prev => ({ ...prev, newTime: e.target.value }))}
              />
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setRescheduleDialog({ open: false, pedido: null, newDate: null, newTime: '12:00' })}>
              Cancelar
            </Button>
            <Button variant="secondary" onClick={openEditAfterReschedule} disabled={updatePedido.isPending}>
              <Pencil className="h-4 w-4 mr-2" />
              Reagendar e Editar
            </Button>
            <Button onClick={confirmReschedule} disabled={updatePedido.isPending}>
              {updatePedido.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Confirmar'
              )}
            </Button>
          </DialogFooter>
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
