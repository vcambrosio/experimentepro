import { Settings } from 'lucide-react';

export default function Configuracoes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Configure seu sistema</p>
      </div>
      <div className="flex items-center justify-center py-24 border-2 border-dashed rounded-lg">
        <div className="text-center text-muted-foreground">
          <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Configurações do sistema</p>
          <p className="text-sm">Conecte ao Supabase para gerenciar configurações</p>
        </div>
      </div>
    </div>
  );
}