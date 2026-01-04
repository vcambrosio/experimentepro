import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useProduto, useCreateProduto, useUpdateProduto } from '@/hooks/useProdutos';
import { useCategorias } from '@/hooks/useCategorias';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    </div>
  );
}