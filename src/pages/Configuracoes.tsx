import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Settings, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Save,
  Loader2,
  Shield,
  User,
  Users,
  Crown,
  UserMinus
} from 'lucide-react';
import { useConfiguracaoEmpresa, useUpdateConfiguracaoEmpresa } from '@/hooks/useConfiguracaoEmpresa';
import { useUsers, useUpdateUserRole } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const empresaSchema = z.object({
  nome_empresa: z.string().min(1, 'Nome da empresa é obrigatório'),
  telefone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  endereco: z.string().optional(),
  validade_orcamento_dias: z.coerce.number().min(1, 'Mínimo 1 dia').max(365, 'Máximo 365 dias'),
});

type EmpresaFormData = z.infer<typeof empresaSchema>;

export default function Configuracoes() {
  const { user, profile, role, isAdmin, signOut } = useAuth();
  const { data: config, isLoading } = useConfiguracaoEmpresa();
  const { data: users, isLoading: loadingUsers } = useUsers();
  const updateConfig = useUpdateConfiguracaoEmpresa();
  const updateUserRole = useUpdateUserRole();
  
  const [activeTab, setActiveTab] = useState('empresa');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
    action: 'promote' | 'demote';
  }>({ open: false, userId: '', userName: '', action: 'promote' });

  const form = useForm<EmpresaFormData>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      nome_empresa: '',
      telefone: '',
      email: '',
      endereco: '',
      validade_orcamento_dias: 30,
    },
  });

  useEffect(() => {
    if (config) {
      form.reset({
        nome_empresa: config.nome_empresa || '',
        telefone: config.telefone || '',
        email: config.email || '',
        endereco: config.endereco || '',
        validade_orcamento_dias: config.validade_orcamento_dias || 30,
      });
    }
  }, [config, form]);

  const onSubmit = async (data: EmpresaFormData) => {
    await updateConfig.mutateAsync({
      id: config?.id,
      nome_empresa: data.nome_empresa,
      telefone: data.telefone || undefined,
      email: data.email || undefined,
      endereco: data.endereco || undefined,
      validade_orcamento_dias: data.validade_orcamento_dias,
    });
  };

  const handleRoleChange = (userId: string, userName: string, currentRole: string) => {
    const action = currentRole === 'admin' ? 'demote' : 'promote';
    setConfirmDialog({ open: true, userId, userName, action });
  };

  const confirmRoleChange = async () => {
    const newRole = confirmDialog.action === 'promote' ? 'admin' : 'user';
    await updateUserRole.mutateAsync({ userId: confirmDialog.userId, newRole });
    setConfirmDialog({ open: false, userId: '', userName: '', action: 'promote' });
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || 'U';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Configurações
        </h1>
        <p className="text-muted-foreground">Configure o sistema e dados da empresa</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'} lg:w-[600px]`}>
          <TabsTrigger value="empresa" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="conta" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Minha Conta
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="usuarios" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
          )}
        </TabsList>

        {/* Empresa Tab */}
        <TabsContent value="empresa" className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Dados da Empresa
                  </CardTitle>
                  <CardDescription>
                    Informações que aparecem nos orçamentos e documentos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="nome_empresa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Empresa *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da sua empresa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Telefone
                          </FormLabel>
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
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="contato@empresa.com" {...field} />
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
                        <FormLabel className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Endereço
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Endereço completo da empresa"
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Configurações de Orçamentos
                  </CardTitle>
                  <CardDescription>
                    Define os padrões para novos orçamentos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="validade_orcamento_dias"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Validade Padrão (dias)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            max="365"
                            className="w-32"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Número de dias de validade padrão para novos orçamentos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button type="submit" disabled={updateConfig.isPending}>
                  {updateConfig.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Configurações
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        {/* Conta Tab */}
        <TabsContent value="conta" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Informações da Conta
              </CardTitle>
              <CardDescription>
                Seus dados de acesso ao sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="font-medium">{user?.email}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Nome</label>
                  <p className="font-medium">{profile?.full_name || 'Não informado'}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Nível de Acesso</span>
                  </div>
                  <Badge variant={role === 'admin' ? 'default' : 'secondary'}>
                    {role === 'admin' ? 'Administrador' : 'Usuário'}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Criado em</label>
                <p className="text-sm">
                  {user?.created_at 
                    ? new Date(user.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })
                    : '-'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Sessão</CardTitle>
              <CardDescription>
                Encerrar sessão no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="destructive" 
                onClick={() => signOut()}
              >
                Sair do Sistema
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usuários Tab (Admin only) */}
        {isAdmin && (
          <TabsContent value="usuarios" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Gerenciar Usuários
                </CardTitle>
                <CardDescription>
                  Visualize e gerencie as permissões dos usuários do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-9 w-24" />
                      </div>
                    ))}
                  </div>
                ) : users && users.length > 0 ? (
                  <ScrollArea className="max-h-[500px]">
                    <div className="space-y-4">
                      {users.map((u) => (
                        <div 
                          key={u.id} 
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={u.avatar_url} />
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {getInitials(u.full_name, u.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium flex items-center gap-2">
                                {u.full_name || 'Sem nome'}
                                {u.role === 'admin' && (
                                  <Crown className="h-4 w-4 text-warning" />
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground">{u.email}</p>
                              <p className="text-xs text-muted-foreground">
                                Desde {format(new Date(u.created_at), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                              {u.role === 'admin' ? 'Admin' : 'Usuário'}
                            </Badge>
                            
                            {u.id !== user?.id && (
                              <Button
                                variant={u.role === 'admin' ? 'outline' : 'default'}
                                size="sm"
                                onClick={() => handleRoleChange(u.id, u.full_name || u.email, u.role)}
                                disabled={updateUserRole.isPending}
                              >
                                {u.role === 'admin' ? (
                                  <>
                                    <UserMinus className="h-4 w-4 mr-2" />
                                    Rebaixar
                                  </>
                                ) : (
                                  <>
                                    <Crown className="h-4 w-4 mr-2" />
                                    Promover
                                  </>
                                )}
                              </Button>
                            )}
                            
                            {u.id === user?.id && (
                              <Badge variant="outline" className="text-xs">Você</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>Nenhum usuário encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'promote' ? 'Promover a Administrador' : 'Rebaixar para Usuário'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'promote' 
                ? `Tem certeza que deseja promover "${confirmDialog.userName}" a administrador? Administradores têm acesso total ao sistema, incluindo valores financeiros e gerenciamento de usuários.`
                : `Tem certeza que deseja rebaixar "${confirmDialog.userName}" para usuário comum? O usuário perderá acesso a funcionalidades administrativas.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>
              {updateUserRole.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Confirmar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}