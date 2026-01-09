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
  Package,
  FileText,
  Trash2,
  Check,
  Banknote
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
import { useUpdatePedido, useDeletePedido } from '@/hooks/usePedidos';
import { useDeleteOrcamento, useUpdateOrcamento } from '@/hooks/useOrcamentos';
import { Pedido, StatusPedido, Orcamento, StatusOrcamento } from '@/types';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { PedidoFormDialog } from '@/components/pedidos/PedidoFormDialog';
import { toast } from 'sonner';
 
type ViewMode = 'month' | 'week';
type CalendarItem = Pedido | Orcamento;
 
interface CalendarioWidgetProps {
  pedidos: Pedido[];
  orcamentos?: Orcamento[];
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

const orcamentoStatusColors: Record<StatusOrcamento, string> = {
  pendente: 'bg-gray-200 border-gray-400 text-gray-700',
  aprovado: 'bg-pink-100 border-pink-300 text-pink-700',
  recusado: 'bg-destructive border-destructive',
  expirado: 'bg-warning border-warning',
  perdido: 'bg-muted border-muted',
};

const orcamentoStatusLabels: Record<StatusOrcamento, string> = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
  expirado: 'Expirado',
  perdido: 'Perdido',
};
 
// Função para obter cor e ícone baseado na categoria
const getCategoriaInfo = (item: CalendarItem) => {
  const itens = 'itens' in item ? item.itens : undefined;
  
  if (!itens || itens.length === 0) {
    return {
      color: 'bg-gray-100 border-gray-300',
      icon: Package,
      label: 'Sem categoria'
    };
  }
  
  const categoriaNome = itens[0].categoria?.nome?.toLowerCase() || '';
  
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
 
// Função auxiliar para verificar se um item é orçamento
const isOrcamento = (item: CalendarItem): item is Orcamento => {
  return 'numero_orcamento' in item;
};
 
// Função auxiliar para obter a data/hora de entrega de um item
const getItemDateTime = (item: CalendarItem): Date => {
  if (isOrcamento(item)) {
    // Para orçamentos, usa data_entrega se definida, senão usa data_orcamento
    const dataString = item.data_entrega || item.data_orcamento;
    // Cria a data no fuso horário local
    const data = dataString ? new Date(dataString + 'T00:00:00') : new Date();
    if (item.hora_entrega) {
      const [hours, minutes] = item.hora_entrega.split(':').map(Number);
      data.setHours(hours, minutes);
    }
    return data;
  } else {
    return new Date(item.data_hora_entrega);
  }
};
 
// Função auxiliar para obter o nome do cliente
const getItemClienteNome = (item: CalendarItem): string => {
  if (isOrcamento(item)) {
    return item.cliente?.nome || '';
  } else {
    return item.cliente?.nome || '';
  }
};
 
// Função auxiliar para obter o nome do setor
const getItemSetorNome = (item: CalendarItem): string | undefined => {
  if (isOrcamento(item)) {
    return item.setor?.nome_setor;
  } else {
    return item.setor?.nome_setor;
  }
};
 
// Função auxiliar para obter o valor total de um item
const getItemValorTotal = (item: CalendarItem): number => {
  return item.valor_total || 0;
};
 
// Draggable Item Component
function DraggableItem({ item, viewMode }: { item: CalendarItem; viewMode: ViewMode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item },
  });
 
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 :1,
  };
  
  const categoriaInfo = getCategoriaInfo(item);
  const CategoriaIcon = categoriaInfo.icon;
  const isOrcamentoItem = isOrcamento(item);
  const itemDateTime = getItemDateTime(item);
  const clienteNome = getItemClienteNome(item);
  const setorNome = getItemSetorNome(item);
 
  // Se for orçamento pendente, usa cor cinza
  const bgColor = isOrcamentoItem && item.status === 'pendente'
    ? 'bg-gray-200 border-gray-400 text-gray-700'
    : categoriaInfo.color;
 
  // Verifica status de execução e pagamento (apenas para pedidos)
  const isExecutado = !isOrcamentoItem && (item as Pedido).status === 'executado';
  const isPago = !isOrcamentoItem && (item as Pedido).status_pagamento === 'pago';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "text-[10px] px-1 py-0.5 rounded truncate border-l-2 cursor-grab active:cursor-grabbing flex items-center gap-0.5 relative",
        bgColor
      )}
      {...listeners}
      {...attributes}
    >
      <GripVertical className="h-2 w-2 shrink-0 opacity-50" />
      {isOrcamentoItem && <FileText className="h-2.5 w-2.5 shrink-0" />}
      <CategoriaIcon className="h-2.5 w-2.5 shrink-0" />
      <span className="hidden sm:inline truncate">
        {isOrcamentoItem && <span className="font-bold mr-1">ORC</span>}
        {format(itemDateTime, 'HH:mm')} - {clienteNome ? clienteNome.split(' ')[0] : ''}{setorNome ? ` - ${setorNome}` : ''}
      </span>
      <span className="sm:hidden">
        {isOrcamentoItem && <span className="font-bold mr-1">ORC</span>}
        {format(itemDateTime, 'HH:mm')}
      </span>
      {/* Indicadores de status */}
      <div className="flex items-center gap-0.5 ml-auto shrink-0">
        {isExecutado && (
          <Check className="h-3 w-3 text-green-600" />
        )}
        {isPago && (
          <Banknote className="h-3 w-3 text-green-600" />
        )}
      </div>
    </div>
  );
}
 
// Droppable Day Cell
function DroppableDay({ 
  day, 
  isCurrentMonth, 
  isSelected, 
  viewMode,
  items,
  onDayClick,
  children 
}: { 
  day: Date;
  isCurrentMonth: boolean;
  isSelected: boolean;
  viewMode: ViewMode;
  items: CalendarItem[];
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
        "min-h-[115px] p-1 border rounded-lg cursor-pointer transition-colors",
        !isCurrentMonth && viewMode === 'month' && "bg-muted/30 opacity-50",
        isToday(day) && "border-primary border-2",
        isSelected && "ring-2 ring-primary",
        items.length > 0 && "hover:bg-accent/50",
        isOver && "bg-primary/20 border-primary border-2",
        "hover:border-primary/50"
      )}
    >
      {children}
    </div>
  );
}
 
export function CalendarioWidget({ pedidos, orcamentos, isLoading }: CalendarioWidgetProps) {
  const { isAdmin } = useAuth();
  const updatePedido = useUpdatePedido();
  const deletePedido = useDeletePedido();
  const deleteOrcamento = useDeleteOrcamento();
  const updateOrcamento = useUpdateOrcamento();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  
  // Drag and drop state
  const [activeDragPedido, setActiveDragPedido] = useState<Pedido | null>(null);
  const [activeDragOrcamento, setActiveDragOrcamento] = useState<Orcamento | null>(null);
  const [rescheduleDialog, setRescheduleDialog] = useState<{
    open: boolean;
    pedido: Pedido | null;
    orcamento: Orcamento | null;
    newDate: Date | null;
    newTime: string;
  }>({ open: false, pedido: null, orcamento: null, newDate: null, newTime: '12:00' });
  
  // Delete confirmation state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    item: CalendarItem | null;
    type: 'pedido' | 'orcamento';
  }>({ open: false, item: null, type: 'pedido' });
  
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
 
  // Combine pedidos and orcamentos into a single array
  const allItems = useMemo(() => {
    const items: CalendarItem[] = [];
    
    // Add pedidos (excluding store sales)
    pedidos?.forEach(pedido => {
      const dataCriacao = new Date(pedido.created_at);
      const dataEntrega = new Date(pedido.data_hora_entrega);
      // Exclui vendas de loja (onde data de entrega é igual à data de criação)
      if (dataCriacao.toDateString() !== dataEntrega.toDateString()) {
        items.push(pedido);
      }
    });
    
    // Add orcamentos (only those with delivery date)
    orcamentos?.forEach(orcamento => {
      if (orcamento.data_entrega) {
        items.push(orcamento);
      }
    });
    
    return items;
  }, [pedidos, orcamentos]);
 
  // Group items by date and sort by time
  const itemsByDate = useMemo(() => {
    const grouped: Record<string, CalendarItem[]> = {};
    allItems.forEach(item => {
      const itemDateTime = getItemDateTime(item);
      const dateKey = format(itemDateTime, 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(item);
    });
     
    // Sort items in each day by time
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) =>
        getItemDateTime(a).getTime() - getItemDateTime(b).getTime()
      );
    });
     
    return grouped;
  }, [allItems]);
 
  // Get items for selected date
  const selectedDateItems = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return itemsByDate[dateKey] || [];
  }, [selectedDate, itemsByDate]);
 
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
    const dayItems = itemsByDate[dateKey] || [];
     
    // Sempre abre o diálogo de detalhes se houver itens
    if (dayItems.length === 0) {
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
    const orcamento = orcamentos?.find(o => o.id === active.id);
    
    if (pedido) {
      setActiveDragPedido(pedido);
    } else if (orcamento) {
      setActiveDragOrcamento(orcamento);
    }
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragPedido(null);
    setActiveDragOrcamento(null);
     
    if (!over) return;
     
    const itemId = active.id as string;
    const newDateKey = over.id as string;
    const pedido = pedidos.find(p => p.id === itemId);
    const orcamento = orcamentos?.find(o => o.id === itemId);
    
    // Check if it's a pedido or orcamento
    if (!pedido && !orcamento) return;
    
    const isPedido = !!pedido;
    const item = isPedido ? pedido : orcamento;
    const itemDateTime = getItemDateTime(item!);
    const currentDateKey = format(itemDateTime, 'yyyy-MM-dd');
     
    // Only show dialog if dropping on a different day
    if (currentDateKey !== newDateKey) {
      // Create date in UTC to avoid timezone issues
      const [year, month, day] = newDateKey.split('-').map(Number);
      const currentTime = format(itemDateTime, 'HH:mm');
      const [hours, minutes] = currentTime.split(':').map(Number);
      const newDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));
       
      setRescheduleDialog({
        open: true,
        pedido: pedido || null,
        orcamento: orcamento || null,
        newDate,
        newTime: currentTime,
      });
       
      // Automatically navigate to new date
      setCurrentDate(newDate);
    }
  };
 
  const confirmReschedule = async () => {
    if (!rescheduleDialog.newDate) return;
    
    const [hours, minutes] = rescheduleDialog.newTime.split(':').map(Number);
    const newDateTime = setMinutes(setHours(rescheduleDialog.newDate, hours), minutes);
  
    try {
      if (rescheduleDialog.pedido) {
        await updatePedido.mutateAsync({
          id: rescheduleDialog.pedido.id,
          data_hora_entrega: newDateTime.toISOString(),
        });
      } else if (rescheduleDialog.orcamento) {
        // Para orçamentos, salva apenas a data no formato yyyy-MM-dd
        await updateOrcamento.mutateAsync({
          id: rescheduleDialog.orcamento.id,
          data_entrega: format(newDateTime, 'yyyy-MM-dd'),
          hora_entrega: rescheduleDialog.newTime,
        });
      }
       
      setRescheduleDialog({ open: false, pedido: null, orcamento: null, newDate: null, newTime: '12:00' });
    } catch (error) {
      console.error('Error rescheduling:', error);
    }
  };
  
  const openEditAfterReschedule = async () => {
    if (!rescheduleDialog.newDate) return;
        
    const [hours, minutes] = rescheduleDialog.newTime.split(':').map(Number);
    const newDateTime = setMinutes(setHours(rescheduleDialog.newDate, hours), minutes);
    
    try {
      if (rescheduleDialog.pedido) {
        await updatePedido.mutateAsync({
          id: rescheduleDialog.pedido.id,
          data_hora_entrega: newDateTime.toISOString(),
        });
        
        // Open edit dialog
        setSelectedPedido(rescheduleDialog.pedido);
        setSelectedDate(rescheduleDialog.newDate);
        setRescheduleDialog({ open: false, pedido: null, orcamento: null, newDate: null, newTime: '12:00' });
        setFormDialogOpen(true);
      } else if (rescheduleDialog.orcamento) {
        // Para orçamentos, salva apenas a data no formato yyyy-MM-dd
        await updateOrcamento.mutateAsync({
          id: rescheduleDialog.orcamento.id,
          data_entrega: format(newDateTime, 'yyyy-MM-dd'),
          hora_entrega: rescheduleDialog.newTime,
        });
        
        setRescheduleDialog({ open: false, pedido: null, orcamento: null, newDate: null, newTime: '12:00' });
      }
    } catch (error) {
      console.error('Error rescheduling:', error);
    }
  };
  
  const handleDeleteClick = (item: CalendarItem) => {
    setDeleteDialog({
      open: true,
      item,
      type: isOrcamento(item) ? 'orcamento' : 'pedido',
    });
  };
  
  const confirmDelete = async () => {
    if (!deleteDialog.item) return;
    
    try {
      if (deleteDialog.type === 'pedido') {
        await deletePedido.mutateAsync(deleteDialog.item.id);
        toast.success('Pedido excluído com sucesso!');
      } else {
        await deleteOrcamento.mutateAsync(deleteDialog.item.id);
        toast.success('Orçamento excluído com sucesso!');
      }
      
      setDeleteDialog({ open: false, item: null, type: 'pedido' });
    } catch (error) {
      console.error('Error deleting:', error);
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
    <>
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
                const dayItems = itemsByDate[dateKey] || [];
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                 
                return (
                  <DroppableDay
                    key={index}
                    day={day}
                    isCurrentMonth={isCurrentMonth}
                    isSelected={isSelected}
                    viewMode={viewMode}
                    items={dayItems}
                    onDayClick={() => handleDayClick(day)}
                  >
                    <div className={cn(
                      "text-xs font-medium mb-1",
                      isToday(day) && "text-primary",
                      !isCurrentMonth && viewMode === 'month' && "text-muted-foreground"
                    )}>
                      {format(day, 'd')}
                    </div>
                     
                    {/* Items indicators */}
                    <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
                      {dayItems.slice(0, viewMode === 'week' ? 8 : 4).map((item) => (
                        <DraggableItem key={item.id} item={item} viewMode={viewMode} />
                      ))}
                      {dayItems.length > (viewMode === 'week' ? 8 : 4) && (
                        <div className="text-[10px] text-muted-foreground text-center">
                          +{dayItems.length - (viewMode === 'week' ? 8 : 4)}
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
              {activeDragOrcamento && (
                <div className={cn(
                  "text-[10px] px-2 py-1 rounded border-l-2 shadow-lg bg-card",
                  orcamentoStatusColors[activeDragOrcamento.status]
                )}>
                  <div className="font-medium">
                    <span className="font-bold mr-1">ORC</span>
                    {format(getItemDateTime(activeDragOrcamento), 'HH:mm')} - {activeDragOrcamento.cliente?.nome || ''}
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
              {selectedDateItems
                .sort((a, b) => getItemDateTime(a).getTime() - getItemDateTime(b).getTime())
                .map((item) => {
                  const isOrcamentoItem = isOrcamento(item);
                  const categoriaInfo = getCategoriaInfo(item);
                  const CategoriaIcon = categoriaInfo.icon;
                  const itemDateTime = getItemDateTime(item);
                  const clienteNome = getItemClienteNome(item);
                  const setorNome = getItemSetorNome(item);
                  const valorTotal = getItemValorTotal(item);
                  
                  // Verifica status de execução e pagamento (apenas para pedidos)
                  const isExecutado = !isOrcamentoItem && (item as Pedido).status === 'executado';
                  const isPago = !isOrcamentoItem && (item as Pedido).status_pagamento === 'pago';
                   
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "p-4 rounded-lg border-l-4 cursor-pointer hover:bg-accent/50 transition-colors",
                        isOrcamentoItem 
                          ? orcamentoStatusColors[item.status]
                          : statusColors[(item as Pedido).status],
                        "bg-card"
                      )}
                      onClick={() => !isOrcamentoItem && handleEditPedido(item as Pedido)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {format(itemDateTime, 'HH:mm')}
                            </span>
                            {isOrcamentoItem ? (
                              <Badge variant="outline" className="text-xs">
                                {orcamentoStatusLabels[item.status]}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                {statusLabels[(item as Pedido).status]}
                              </Badge>
                            )}
                            <Badge variant="outline" className={cn("text-xs", categoriaInfo.color)}>
                              <CategoriaIcon className="h-3 w-3 mr-1" />
                              {categoriaInfo.label}
                            </Badge>
                          </div>
                         
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{clienteNome}</span>
                          </div>
                         
                          {setorNome && (
                            <p className="text-xs text-muted-foreground ml-6">
                              {setorNome}
                            </p>
                          )}
                        </div>
                       
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            {isAdmin && (
                              <p className="font-semibold text-primary">
                                {formatCurrency(valorTotal)}
                              </p>
                            )}
                            {/* Indicadores de status */}
                            {!isOrcamentoItem && (
                              <div className="flex items-center gap-1">
                                {isExecutado && (
                                  <Check className="h-5 w-5 text-green-600" />
                                )}
                                {isPago && (
                                  <Banknote className="h-5 w-5 text-green-600" />
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {!isOrcamentoItem && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditPedido(item as Pedido);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(item);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
              {rescheduleDialog.orcamento ? 'Reagendar Orçamento' : 'Reagendar Pedido de Evento ou Cesta'}
            </DialogTitle>
            <DialogDescription>
              {rescheduleDialog.orcamento
                ? <>Confirme a nova data e horário para o orçamento de <strong>{rescheduleDialog.orcamento.cliente?.nome}</strong></>
                : <>Confirme a nova data e horário para o pedido de evento ou cesta de <strong>{rescheduleDialog.pedido?.cliente?.nome}</strong></>
              }
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
            <Button variant="outline" onClick={() => setRescheduleDialog({ open: false, pedido: null, orcamento: null, newDate: null, newTime: '12:00' })}>
              Cancelar
            </Button>
            {!rescheduleDialog.orcamento && (
              <Button variant="secondary" onClick={openEditAfterReschedule} disabled={updatePedido.isPending}>
                <Pencil className="h-4 w-4 mr-2" />
                Reagendar e Editar
              </Button>
            )}
            <Button onClick={confirmReschedule} disabled={updatePedido.isPending || updateOrcamento.isPending}>
              {(updatePedido.isPending || updateOrcamento.isPending) ? (
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
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              {deleteDialog.type === 'pedido' ? 'Excluir Pedido' : 'Excluir Orçamento'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este {deleteDialog.type === 'pedido' ? 'pedido' : 'orçamento'}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteDialog.type === 'pedido' ? deletePedido.isPending : deleteOrcamento.isPending}
            >
              {deleteDialog.type === 'pedido' && deletePedido.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : deleteDialog.type === 'orcamento' && deleteOrcamento.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
