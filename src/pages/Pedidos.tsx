import { ShoppingCart } from 'lucide-react';

export default function Pedidos() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Pedidos</h1>
        <p className="text-muted-foreground">Gerencie seus pedidos</p>
      </div>
      <div className="flex items-center justify-center py-24 border-2 border-dashed rounded-lg">
        <div className="text-center text-muted-foreground">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Lista de pedidos</p>
          <p className="text-sm">Conecte ao Supabase para gerenciar pedidos</p>
        </div>
      </div>
    </div>
  );
}