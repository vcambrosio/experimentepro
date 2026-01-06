import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useCategoria, useCreateCategoria, useUpdateCategoria } from '@/hooks/useCategorias';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Skeleton } from '@/components/ui/skeleton';

const categoriaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  ativo: z.boolean(),
});

type CategoriaFormData = z.infer<typeof categoriaSchema>;

export default function CategoriaForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const { setHeader } = usePageHeader();

  useEffect(() => {
    setHeader(id ? 'Editar Categoria' : 'Nova Categoria', id ? 'Atualize as informações da categoria' : 'Cadastre uma nova categoria');
  }, [id, setHeader]);

  const { data: categoria, isLoading } = useCategoria(id || '');
  const createCategoria = useCreateCategoria();
  const updateCategoria = useUpdateCategoria();

  const form = useForm<CategoriaFormData>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nome: '',
      ativo: true,
    },
  });

  useEffect(() => {
    if (categoria) {
      form.reset({
        nome: categoria.nome,
        ativo: categoria.ativo,
      });
    }
  }, [categoria, form]);

  const onSubmit = async (data: CategoriaFormData) => {
    if (isEditing) {
      await updateCategoria.mutateAsync({ id, nome: data.nome, ativo: data.ativo });
    } else {
      await createCategoria.mutateAsync({ nome: data.nome, ativo: data.ativo });
    }
    navigate('/categorias');
  };

  const isPending = createCategoria.isPending || updateCategoria.isPending;

  if (isEditing && isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Categoria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da categoria" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ativo"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Categoria Ativa</FormLabel>
                      <FormDescription>
                        Categorias inativas não aparecem nas seleções
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
            <Button type="button" variant="outline" onClick={() => navigate('/categorias')}>
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