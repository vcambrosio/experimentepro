import { FileText } from 'lucide-react';

export default function Orcamentos() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Orçamentos</h1>
        <p className="text-muted-foreground">Gerencie seus orçamentos</p>
      </div>
      <div className="flex items-center justify-center py-24 border-2 border-dashed rounded-lg">
        <div className="text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Lista de orçamentos</p>
          <p className="text-sm">Conecte ao Supabase para gerenciar orçamentos</p>
        </div>
      </div>
    </div>
  );
}