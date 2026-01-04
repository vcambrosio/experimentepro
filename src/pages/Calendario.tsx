import { Calendar as CalendarIcon } from 'lucide-react';

export default function Calendario() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Calendário</h1>
        <p className="text-muted-foreground">Visualize seus pedidos agendados</p>
      </div>
      <div className="flex items-center justify-center py-24 border-2 border-dashed rounded-lg">
        <div className="text-center text-muted-foreground">
          <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Calendário de eventos</p>
          <p className="text-sm">Conecte ao Supabase para ver os pedidos</p>
        </div>
      </div>
    </div>
  );
}