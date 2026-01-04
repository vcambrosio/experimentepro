import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2, Plus, Trash2, ListChecks, FolderPlus } from 'lucide-react';
import { useProduto, useCreateProduto, useUpdateProduto } from '@/hooks/useProdutos';
import { useCategorias, useCreateCategoria } from '@/hooks/useCategorias';
import { useChecklistItens, useCreateChecklistItem, useUpdateChecklistItem, useDeleteChecklistItem } from '@/hooks/useChecklist';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
 
const produtoSchema = z.object({
  categoria_id: z.string().min(1, 'Categoria é obrigatória'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao_padrao: z.string().optional(),
  valor_venda: z.coerce.number().min(0, 'Valor deve ser positivo'),
  ativo: z.boolean(),
});
 
type ProdutoFormData = z.infer<typeof produtoSchema>;
 
export default function ProdutoForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const { isAdmin } = useAuth();
 
  const { data: produto, isLoading } = useProduto(id || '');
  const { data: categorias } = useCategorias();
  const createProduto = useCreateProduto();
  const updateProduto = useUpdateProduto();
  const createCategoria = useCreateCategoria();
  
  // Checklist management
  const { data: checklistItens, isLoading: loadingChecklist } = useChecklistItens(id || '');
  const createChecklistItem = useCreateChecklistItem();
  const updateChecklistItem = useUpdateChecklistItem();
  const deleteChecklistItem = useDeleteChecklistItem();
  
  const [novoItemChecklist, setNovoItemChecklist] = useState('');
  const [novaQuantidade, setNovaQuantidade] = useState(1);
  const [novaCategoriaDialog, setNovaCategoriaDialog] = useState(false);
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('');

  const form = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      categoria_id: '',
      nome: '',
      descricao_padrao: '',
      valor_venda: 0,
      ativo: true,
    },
  });
 
  useEffect(() => {
    if (produto) {
      form.reset({
        categoria_id: produto.categoria_id,
        nome: produto.nome,
        descricao_padrao: produto.descricao_padrao || '',
        valor_venda: produto.valor_venda,
        ativo: produto.ativo,
      });
    }
  }, [produto, form]);

  const onSubmit = async (data: ProdutoFormData) => {
    if (isEditing) {
      await updateProduto.mutateAsync({ 
        id, 
        categoria_id: data.categoria_id,
        nome: data.nome,
        valor_venda: data.valor_venda,
        ativo: data.ativo,
        descricao_padrao: data.descricao_padrao || undefined,
      });
    } else {
      await createProduto.mutateAsync({
        categoria_id: data.categoria_id,
        nome: data.nome,
        valor_venda: data.valor_venda,
        ativo: data.ativo,
        descricao_padrao: data.descricao_padrao || undefined,
      });
    }
    navigate('/produtos');
  };

  const isPending = createProduto.isPending || updateProduto.isPending;

  const handleAddChecklistItem = async () => {
    if (!id || !novoItemChecklist) {
      return;
    }
    
    await createChecklistItem.mutateAsync({
      produto_id: id,
      descricao: novoItemChecklist,
      quantidade_por_unidade: novaQuantidade,
      ordem: (checklistItens?.length || 0) + 1,
    });
    
    setNovoItemChecklist('');
    setNovaQuantidade(1);
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    await deleteChecklistItem.mutateAsync(itemId);
  };

  const handleUpdateChecklistItem = async (itemId: string, quantidade: number) => {
    await updateChecklistItem.mutateAsync({
      id: itemId,
      quantidade_por_unidade: quantidade,
    });
  };

  const handleCreateCategoria = async () => {
    if (!novaCategoriaNome.trim()) {
      toast.error('Nome da categoria é obrigatório');
      return;
    }

    try {
      const novaCategoria = await createCategoria.mutateAsync({
        nome: novaCategoriaNome.trim(),
        ativo: true,
      });
      
      // Selecionar a nova categoria criada
      form.setValue('categoria_id', novaCategoria.id);
      
      // Fechar o dialog e limpar o campo
      setNovaCategoriaDialog(false);
      setNovaCategoriaNome('');
      
      toast.success('Categoria criada com sucesso!');
    } catch (error) {
      // O erro já é tratado pelo hook
    }
  };

  if (isEditing && isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/produtos')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {isEditing ? 'Editar Produto' : 'Novo Produto'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Atualize as informações do produto' : 'Cadastre um novo produto'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Produto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="categoria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categorias?.filter(c => c.ativo).map((categoria) => (
                          <SelectItem key={categoria.id} value={categoria.id}>
                            {categoria.nome}
                          </SelectItem>
                        ))}
                        <div className="border-t">
                          <button
                            type="button"
                            onClick={() => setNovaCategoriaDialog(true)}
                            className="w-full px-2 py-1.5 text-sm text-primary hover:bg-muted flex items-center gap-2"
                          >
                            <FolderPlus className="h-4 w-4" />
                            Nova Categoria
                          </button>
                        </div>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do produto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descricao_padrao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição Padrão</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição do produto (pode ser editada em cada pedido)" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Esta descrição serve como modelo inicial e pode ser personalizada em cada pedido.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isAdmin && (
                <FormField
                  control={form.control}
                  name="valor_venda"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor de Venda *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          placeholder="0,00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="ativo"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Produto Ativo</FormLabel>
                      <FormDescription>
                        Produtos inativos não aparecem nas seleções
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Checklist Card - Only for editing */}
          {isEditing && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-primary" />
                  Itens de Checklist
                </CardTitle>
                <CardDescription>
                  Configure os itens necessários para este produto (ex: Coffee Break)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add new checklist item */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Descrição do item"
                    value={novoItemChecklist}
                    onChange={(e) => setNovoItemChecklist(e.target.value)}
                  />
                  <Input
                    type="number"
                    min="1"
                    placeholder="Qtd por unidade"
                    value={novaQuantidade}
                    onChange={(e) => setNovaQuantidade(parseInt(e.target.value) || 1)}
                    className="w-40"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddChecklistItem}
                    disabled={!novoItemChecklist || createChecklistItem.isPending}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Checklist items list */}
                {loadingChecklist ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : checklistItens && checklistItens.length > 0 ? (
                  <div className="space-y-2">
                    {checklistItens.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.descricao}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantidade_por_unidade}x por unidade
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantidade_por_unidade}
                            onChange={(e) => handleUpdateChecklistItem(item.id, parseInt(e.target.value) || 1)}
                            className="w-24"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteChecklistItem(item.id)}
                            disabled={deleteChecklistItem.isPending}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhum item de checklist configurado
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/produtos')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Dialog para criar nova categoria */}
      <Dialog open={novaCategoriaDialog} onOpenChange={setNovaCategoriaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-primary" />
              Nova Categoria
            </DialogTitle>
            <DialogDescription>
              Crie uma nova categoria para o produto
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome da Categoria *</label>
              <Input
                placeholder="Ex: Bebidas, Salgados, Doces"
                value={novaCategoriaNome}
                onChange={(e) => setNovaCategoriaNome(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateCategoria();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setNovaCategoriaDialog(false);
              setNovaCategoriaNome('');
            }}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateCategoria}
              disabled={!novaCategoriaNome.trim() || createCategoria.isPending}
            >
              {createCategoria.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Criar Categoria
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
