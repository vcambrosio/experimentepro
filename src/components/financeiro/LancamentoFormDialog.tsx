import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCategoriasFinanceiras } from '@/hooks/useFinanceiro';
import type { LancamentoFinanceiro, TipoFinanceiro } from '@/types';

interface LancamentoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (lancamento: Omit<LancamentoFinanceiro, 'id' | 'created_at' | 'updated_at' | 'categoria' | 'pedido'>) => void;
  lancamento?: LancamentoFinanceiro;
  pedidoParaLancamento?: {
    id: string;
    valor_total: number;
    cliente?: {
      nome?: string;
    };
  };
  isLoading?: boolean;
}

export function LancamentoFormDialog({
  open,
  onOpenChange,
  onSubmit,
  lancamento,
  pedidoParaLancamento,
  isLoading = false,
}: LancamentoFormDialogProps) {
  const [tipo, setTipo] = useState<TipoFinanceiro>('receita');
  const [categoriaId, setCategoriaId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [dataLancamento, setDataLancamento] = useState('');
  const [dataPagamento, setDataPagamento] = useState('');
  const [status, setStatus] = useState<'pendente' | 'realizado' | 'cancelado'>('pendente');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [recorrente, setRecorrente] = useState(false);
  const [recorrenciaPeriodo, setRecorrenciaPeriodo] = useState<'mensal' | 'trimestral' | 'semestral' | 'anual'>('mensal');

  const { data: categorias } = useCategoriasFinanceiras(tipo);

  // Reset form when dialog opens/closes or lancamento changes
  useEffect(() => {
    if (open) {
      if (lancamento) {
        // Modo de edição de lançamento existente
        setTipo(lancamento.tipo);
        setCategoriaId(lancamento.categoria_id);
        setDescricao(lancamento.descricao);
        setValor(lancamento.valor.toString());
        setDataLancamento(lancamento.data_lancamento.split('T')[0]);
        setDataPagamento(lancamento.data_pagamento?.split('T')[0] || '');
        setStatus(lancamento.status);
        setFormaPagamento(lancamento.forma_pagamento || '');
        setObservacoes(lancamento.observacoes || '');
        setRecorrente(lancamento.recorrente);
        setRecorrenciaPeriodo(lancamento.recorrencia_periodo || 'mensal');
      } else if (pedidoParaLancamento) {
        // Modo de criação a partir de um pedido
        setTipo('receita');
        setCategoriaId('');
        setDescricao(`Receita de Pedido #${pedidoParaLancamento.id} - ${pedidoParaLancamento.cliente?.nome || 'Cliente'}`);
        setValor(pedidoParaLancamento.valor_total.toString());
        setDataLancamento(new Date().toISOString().split('T')[0]);
        setDataPagamento(new Date().toISOString().split('T')[0]);
        setStatus('realizado');
        setFormaPagamento('');
        setObservacoes(`Referente ao pedido #${pedidoParaLancamento.id}`);
        setRecorrente(false);
        setRecorrenciaPeriodo('mensal');
      } else {
        // Modo de criação normal
        setTipo('receita');
        setCategoriaId('');
        setDescricao('');
        setValor('');
        setDataLancamento(new Date().toISOString().split('T')[0]);
        setDataPagamento('');
        setStatus('pendente');
        setFormaPagamento('');
        setObservacoes('');
        setRecorrente(false);
        setRecorrenciaPeriodo('mensal');
      }
    }
  }, [open, lancamento, pedidoParaLancamento]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoriaId || !descricao || !valor || !dataLancamento) {
      return;
    }

    onSubmit({
      tipo,
      categoria_id: categoriaId,
      descricao,
      valor: parseFloat(valor),
      data_lancamento: dataLancamento,
      data_pagamento: dataPagamento || undefined,
      status,
      forma_pagamento: formaPagamento || undefined,
      observacoes: observacoes || undefined,
      recorrente,
      recorrencia_periodo: recorrente ? recorrenciaPeriodo : undefined,
      pedido_id: lancamento?.pedido_id,
      created_by: lancamento?.created_by,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {lancamento ? 'Editar Lançamento' : pedidoParaLancamento ? 'Registrar Pagamento de Pedido' : 'Novo Lançamento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select value={tipo} onValueChange={(value: TipoFinanceiro) => setTipo(value)} disabled={!!pedidoParaLancamento}>
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria *</Label>
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição do lançamento"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                required
                disabled={!!pedidoParaLancamento}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_lancamento">Data do Lançamento *</Label>
              <Input
                id="data_lancamento"
                type="date"
                value={dataLancamento}
                onChange={(e) => setDataLancamento(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_pagamento">Data de Pagamento</Label>
              <Input
                id="data_pagamento"
                type="date"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value: 'pendente' | 'realizado' | 'cancelado') => setStatus(value)} disabled={!!pedidoParaLancamento}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="realizado">Realizado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
            <Input
              id="forma_pagamento"
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
              placeholder="Ex: Dinheiro, Cartão, PIX, Boleto"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="recorrente"
              checked={recorrente}
              onCheckedChange={setRecorrente}
              disabled={!!pedidoParaLancamento}
            />
            <Label htmlFor="recorrente">Lançamento Recorrente</Label>
          </div>

          {recorrente && (
            <div className="space-y-2">
              <Label htmlFor="recorrencia_periodo">Período de Recorrência</Label>
              <Select value={recorrenciaPeriodo} onValueChange={(value: 'mensal' | 'trimestral' | 'semestral' | 'anual') => setRecorrenciaPeriodo(value)}>
                <SelectTrigger id="recorrencia_periodo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações adicionais"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : lancamento ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
