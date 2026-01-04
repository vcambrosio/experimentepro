import { useEffect, useState, useRef } from 'react';
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
  UserMinus,
  Upload,
  Image as ImageIcon,
  X,
  UserPlus,
  Key,
  Edit,
  Trash2
} from 'lucide-react';
import { useConfiguracaoEmpresa, useUpdateConfiguracaoEmpresa } from '@/hooks/useConfiguracaoEmpresa';
import { useUsers, useUpdateUserRole, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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

const usuarioSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  fullName: z.string().min(1, 'Nome completo é obrigatório'),
  role: z.enum(['admin', 'user']),
});

type UsuarioFormData = z.infer<typeof usuarioSchema>;

const editUsuarioSchema = z.object({
  fullName: z.string().min(1, 'Nome completo é obrigatório'),
});

type EditUsuarioFormData = z.infer<typeof editUsuarioSchema>;

type UploadType = 'logo_sistema' | 'logo_pdf';

export default function Configuracoes() {
  const { user, profile, role, isAdmin, signOut } = useAuth();
  const { data: config, isLoading } = useConfiguracaoEmpresa();
  const { data: users, isLoading: loadingUsers } = useUsers();
  const updateConfig = useUpdateConfiguracaoEmpresa();
  const updateUserRole = useUpdateUserRole();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  
  const [activeTab, setActiveTab] = useState('empresa');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
    action: 'promote' | 'demote' | 'delete';
  }>({ open: false, userId: '', userName: '', action: 'promote' });
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    userId: string;
    fullName: string;
  }>({ open: false, userId: '', fullName: '' });
  const [uploadDialog, setUploadDialog] = useState<{
    open: boolean;
    type: UploadType;
  }>({ open: false, type: 'logo_sistema' });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userDialog, setUserDialog] = useState<{ open: boolean }>({ open: false });
  
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

  const userForm = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      role: 'user',
    },
  });

  const editUserForm = useForm<EditUsuarioFormData>({
    resolver: zodResolver(editUsuarioSchema),
    defaultValues: {
      fullName: '',
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

  useEffect(() => {
    if (editDialog.open) {
      editUserForm.reset({
        fullName: editDialog.fullName,
      });
    }
  }, [editDialog.open, editDialog.fullName, editUserForm]);

  const handleUploadLogo = async (event: React.ChangeEvent<HTMLInputElement>, type: UploadType) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      console.log('Iniciando upload:', { fileName: file.name, fileSize: file.size, fileType: file.type });

      // Criar FormData para enviar o arquivo
      const formData = new FormData();
      formData.append('file', file);

      // Fazer upload para a API local
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta do servidor:', errorText);
        const errorData = errorText ? JSON.parse(errorText) : {};
        throw new Error(errorData.error || `Erro HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Upload realizado com sucesso:', data);

      // Atualizar configuração com a URL retornada
      await updateConfig.mutateAsync({
        id: config?.id,
        [type === 'logo_sistema' ? 'logo_url' : 'logo_pdf_url']: data.url,
      });

      toast.success('Logo atualizada com sucesso!');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      const errorMessage = error?.message || 'Erro desconhecido';
      
      // Mostrar erro no toast e também em um alert para facilitar a cópia
      toast.error(`Erro ao fazer upload da logo. Veja o console para detalhes.`);
      alert(`Erro ao fazer upload da logo:\n\n${errorMessage}\n\nVerifique o console (F12) para mais detalhes.`);
    } finally {
      setUploading(false);
      setUploadDialog({ open: false, type: 'logo_sistema' });
    }
  };

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

  const onSubmitUser = async (data: UsuarioFormData) => {
    await createUser.mutateAsync({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      role: data.role as any,
    });
    setUserDialog({ open: false });
    userForm.reset({
      email: '',
      password: '',
      fullName: '',
      role: 'user',
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

  const handleEditUser = (userId: string, fullName: string) => {
    setEditDialog({ open: true, userId, fullName });
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    setConfirmDialog({ open: true, userId, userName, action: 'delete' });
  };

  const confirmDeleteUser = async () => {
    await deleteUser.mutateAsync(confirmDialog.userId);
    setConfirmDialog({ open: false, userId: '', userName: '', action: 'promote' });
  };

  const onSubmitEditUser = async (data: EditUsuarioFormData) => {
    await updateUser.mutateAsync({
      userId: editDialog.userId,
      fullName: data.fullName,
    });
    setEditDialog({ open: false, userId: '', fullName: '' });
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

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    Logomarcas
                  </CardTitle>
                  <CardDescription>
                    Faça upload das logomarcas utilizadas no sistema e documentos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Logo do Sistema</label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Utilizada no canto superior esquerdo do sistema
                      </p>
                      {config?.logo_url ? (
                        <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                          <img 
                            src={config.logo_url} 
                            alt="Logo do sistema" 
                            className="h-16 w-auto max-w-[200px] object-contain"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUploadDialog({ open: true, type: 'logo_sistema' })}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Alterar
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full h-32 border-2 border-dashed"
                          onClick={() => setUploadDialog({ open: true, type: 'logo_sistema' })}
                        >
                          <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                          <span className="text-sm">Fazer upload da logo</span>
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Logo do Orçamento (PDF)</label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Utilizada no cabeçalho do orçamento em PDF
                      </p>
                      {config?.logo_pdf_url ? (
                        <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                          <img 
                            src={config.logo_pdf_url} 
                            alt="Logo do orçamento" 
                            className="h-16 w-auto max-w-[200px] object-contain"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUploadDialog({ open: true, type: 'logo_pdf' })}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Alterar
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full h-32 border-2 border-dashed"
                          onClick={() => setUploadDialog({ open: true, type: 'logo_pdf' })}
                        >
                          <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                          <span className="text-sm">Fazer upload da logo</span>
                        </Button>
                      )}
                    </div>
                  </div>
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
                <div className="flex justify-end mb-4">
                  <Button onClick={() => setUserDialog({ open: true })}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Novo Usuário
                  </Button>
                </div>
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
                              <>
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
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditUser(u.id, u.full_name || '')}
                                  disabled={updateUser.isPending}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteUser(u.id, u.full_name || u.email)}
                                  disabled={deleteUser.isPending}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </Button>
                              </>
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
              {confirmDialog.action === 'delete'
                ? 'Excluir Usuário'
                : confirmDialog.action === 'promote'
                  ? 'Promover a Administrador'
                  : 'Rebaixar para Usuário'
              }
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'delete'
                ? `Tem certeza que deseja excluir "${confirmDialog.userName}"? Esta ação não pode ser desfeita e removerá todos os dados do usuário do sistema.`
                : confirmDialog.action === 'promote'
                  ? `Tem certeza que deseja promover "${confirmDialog.userName}" a administrador? Administradores têm acesso total ao sistema, incluindo valores financeiros e gerenciamento de usuários.`
                  : `Tem certeza que deseja rebaixar "${confirmDialog.userName}" para usuário comum? O usuário perderá acesso a funcionalidades administrativas.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDialog.action === 'delete' ? confirmDeleteUser : confirmRoleChange}
              className={confirmDialog.action === 'delete' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {(updateUserRole.isPending || deleteUser.isPending) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Confirmar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Logo Dialog */}
      <Dialog open={uploadDialog.open} onOpenChange={(open) => setUploadDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              {uploadDialog.type === 'logo_sistema' ? 'Upload Logo do Sistema' : 'Upload Logo do Orçamento'}
            </DialogTitle>
            <DialogDescription>
              {uploadDialog.type === 'logo_sistema'
                ? 'Selecione a imagem que será utilizada no canto superior esquerdo do sistema'
                : 'Selecione a imagem que será utilizada no cabeçalho do orçamento em PDF'
              }
            </DialogDescription>
          </DialogHeader>
        
          <div className="space-y-4 py-4">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={(e) => handleUploadLogo(e, uploadDialog.type)}
              disabled={uploading}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:text-foreground file:cursor-pointer"
            />
          
            {uploading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                <span>Enviando...</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialog({ open: false, type: 'logo_sistema' })}>
              Cancelar
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Fazer Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={userDialog.open} onOpenChange={(open) => setUserDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Cadastrar Novo Usuário
            </DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo usuário no sistema
            </DialogDescription>
          </DialogHeader>
          <Form {...userForm}>
            <form onSubmit={userForm.handleSubmit(onSubmitUser)} className="space-y-4">
              <FormField
                control={userForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do usuário" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={userForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemplo.com" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={userForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormDescription>
                      Mínimo 6 caracteres
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={userForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível de Acesso *</FormLabel>
                    <FormControl>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            value="user"
                            checked={field.value === 'user'}
                            onChange={() => field.onChange('user')}
                            className="w-4 h-4"
                          />
                          <span>Usuário</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            value="admin"
                            checked={field.value === 'admin'}
                            onChange={() => field.onChange('admin')}
                            className="w-4 h-4"
                          />
                          <span>Administrador</span>
                        </label>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Administradores têm acesso total ao sistema, incluindo valores financeiros e gerenciamento de usuários.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setUserDialog({ open: false })}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createUser.isPending}>
                  {createUser.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Criar Usuário
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Editar Usuário
            </DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário
            </DialogDescription>
          </DialogHeader>
          <Form {...editUserForm}>
            <form onSubmit={editUserForm.handleSubmit(onSubmitEditUser)} className="space-y-4">
              <FormField
                control={editUserForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do usuário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialog({ open: false, userId: '', fullName: '' })}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateUser.isPending}>
                  {updateUser.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
