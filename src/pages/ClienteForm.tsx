import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2, Plus, Trash2, Building2 } from 'lucide-react';
import { useCliente, useCreateCliente, useUpdateCliente, useSetoresCliente, useCreateSetor, useDeleteSetor } from '@/hooks/useClientes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { TipoPessoa } from '@/types';
import { toast } from 'sonner';

const clienteSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  tipo_pessoa: z.enum(['fisica', 'juridica'] as const),
  cpf_cnpj: z.string().optional(),
  endereco: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  emite_nota_fiscal: z.boolean(),
  ativo: z.boolean(),
});

type ClienteFormData = z.infer<typeof clienteSchema>;

export default function ClienteForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const { data: cliente, isLoading } = useCliente(id || '');
  const createCliente = useCreateCliente();
  const updateCliente = useUpdateCliente();

  // Setores management
  const { data: setores, isLoading: loadingSetores } = useSetoresCliente(id || '');
  const createSetor = useCreateSetor();
  const deleteSetor = useDeleteSetor();

  const [novoSetor, setNovoSetor] = useState('');
  const [novoResponsavel, setNovoResponsavel] = useState('');
  const [setoresTemp, setSetoresTemp] = useState<Array<{ nome_setor: string; responsavel?: string }>>([]);

  const form = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: '',
      tipo_pessoa: 'fisica',
      cpf_cnpj: '',
      endereco: '',
      telefone: '',
      email: '',
      emite_nota_fiscal: false,
      ativo: true,
    },
  });

  useEffect(() => {
    if (cliente) {
      form.reset({
        nome: cliente.nome,
        tipo_pessoa: cliente.tipo_pessoa,
        cpf_cnpj: cliente.cpf_cnpj || '',
        endereco: cliente.endereco || '',
        telefone: cliente.telefone || '',
        email: cliente.email || '',
        emite_nota_fiscal: cliente.emite_nota_fiscal,
        ativo: cliente.ativo,
      });
    }
  }, [cliente, form]);

  const onSubmit = async (data: ClienteFormData) => {
    let clienteId = id;

    if (isEditing) {
      await updateCliente.mutateAsync({
        id,
        nome: data.nome,
        tipo_pessoa: data.tipo_pessoa,
        emite_nota_fiscal: data.emite_nota_fiscal,
        ativo: data.ativo,
        email: data.email || undefined,
        cpf_cnpj: data.cpf_cnpj || undefined,
        endereco: data.endereco || undefined,
        telefone: data.telefone || undefined,
      });
    } else {
      const result = await createCliente.mutateAsync({
        nome: data.nome,
        tipo_pessoa: data.tipo_pessoa,
        emite_nota_fiscal: data.emite_nota_fiscal,
        ativo: data.ativo,
        email: data.email || undefined,
        cpf_cnpj: data.cpf_cnpj || undefined,
        endereco: data.endereco || undefined,
        telefone: data.telefone || undefined,
      });
      clienteId = result.id;

      // Se houver setores temporários, cria-os agora
      if (data.tipo_pessoa === 'juridica' && setoresTemp.length > 0) {
        for (const setor of setoresTemp) {
          await createSetor.mutateAsync({
            cliente_id: clienteId,
            nome_setor: setor.nome_setor,
            responsavel: setor.responsavel,
          });
        }
        setSetoresTemp([]);
      }
    }
    navigate('/clientes');
  };

  const isPending = createCliente.isPending || updateCliente.isPending;

  const handleAddSetor = async () => {
    if (!novoSetor) {
      toast.error('Preencha o nome do setor');
      return;
    }

    // Se estiver editando, cria o setor diretamente
    if (id) {
      await createSetor.mutateAsync({
        cliente_id: id,
        nome_setor: novoSetor,
        responsavel: novoResponsavel || undefined,
      });
    } else {
      // Se estiver criando, adiciona ao estado temporário
      setSetoresTemp([...setoresTemp, {
        nome_setor: novoSetor,
        responsavel: novoResponsavel,
      }]);
    }

    setNovoSetor('');
    setNovoResponsavel('');
  };

  const handleDeleteSetor = async (setorId: string) => {
    // Se estiver criando, remove do estado temporário
    if (!id) {
      setSetoresTemp(setoresTemp.filter(s => s.nome_setor !== setorId));
    } else {
      // Se estiver editando, remove do banco
      await deleteSetor.mutateAsync(setorId);
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
        <Button variant="ghost" size="icon" onClick={() => navigate('/clientes')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Atualize as informações do cliente' : 'Cadastre um novo cliente'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do cliente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo_pessoa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Pessoa *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fisica">Pessoa Física</SelectItem>
                        <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cpf_cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {form.watch('tipo_pessoa') === 'juridica' ? 'CNPJ' : 'CPF'}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={form.watch('tipo_pessoa') === 'juridica' ? '00.000.000/0000-00' : '000.000.000-00'} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Setores Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Setores da Empresa
              </CardTitle>
              <CardDescription>
                Adicione setores para organizar pedidos por departamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new setor */}
              <div className="flex gap-2">
                <Input
                  placeholder="Nome do setor"
                  value={novoSetor}
                  onChange={(e) => setNovoSetor(e.target.value)}
                />
                <Input
                  placeholder="Responsável (opcional)"
                  value={novoResponsavel}
                  onChange={(e) => setNovoResponsavel(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddSetor}
                  disabled={!novoSetor || createSetor.isPending}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Setores list */}
              {loadingSetores ? (
                <div className="space-y-2">
                  {[1, 2].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (setores && setores.length > 0) || (setoresTemp && setoresTemp.length > 0) ? (
                <div className="space-y-2">
                  {/* Mostra setores do banco (editando) ou setores temporários (criando) */}
                  {(setores || []).map((setor) => (
                    <div
                      key={setor.id || setor.nome_setor}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{setor.nome_setor}</p>
                        {setor.responsavel && (
                          <p className="text-sm text-muted-foreground">
                            Responsável: {setor.responsavel}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSetor(setor.id || setor.nome_setor)}
                        disabled={deleteSetor.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {setoresTemp.map((setor, index) => (
                    <div
                      key={`temp-${index}`}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{setor.nome_setor}</p>
                        {setor.responsavel && (
                          <p className="text-sm text-muted-foreground">
                            Responsável: {setor.responsavel}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSetor(setor.nome_setor)}
                        disabled={deleteSetor.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum setor cadastrado
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="endereco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Endereço completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="emite_nota_fiscal"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Emite Nota Fiscal</FormLabel>
                      <FormDescription>
                        Marque se o cliente solicita nota fiscal
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ativo"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Cliente Ativo</FormLabel>
                      <FormDescription>
                        Clientes inativos não aparecem nas seleções
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
            <Button type="button" variant="outline" onClick={() => navigate('/clientes')}>
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
