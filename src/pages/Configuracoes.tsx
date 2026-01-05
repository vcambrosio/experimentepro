import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
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
  Trash2,
  AlertTriangle,
  DollarSign,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  Palette,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { useConfiguracaoEmpresa, useUpdateConfiguracaoEmpresa } from '@/hooks/useConfiguracaoEmpresa';
import { useUsers, useUpdateUserRole, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { useCategoriasFinanceiras, useCreateCategoriaFinanceira, useUpdateCategoriaFinanceira, useDeleteCategoriaFinanceira, useCreateLancamento, useLancamentosFinanceiros } from '@/hooks/useFinanceiro';
import { supabase } from '@/lib/supabase';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const { user, profile, role, isAdmin, signOut, updatePassword } = useAuth();
  const { data: config, isLoading } = useConfiguracaoEmpresa();
  const { data: users, isLoading: loadingUsers } = useUsers();
  const { data: categoriasFinanceiras, isLoading: loadingCategorias } = useCategoriasFinanceiras();
  const { data: lancamentosFinanceiros, isLoading: loadingLancamentos } = useLancamentosFinanceiros();
  const updateConfig = useUpdateConfiguracaoEmpresa();
  const updateUserRole = useUpdateUserRole();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const createCategoria = useCreateCategoriaFinanceira();
  const updateCategoria = useUpdateCategoriaFinanceira();
  const deleteCategoria = useDeleteCategoriaFinanceira();
  const createLancamento = useCreateLancamento();
  const queryClient = useQueryClient();
  const { mutate: deleteAllLancamentos, isPending: deletingAllLancamentos } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('lancamentos_financeiros')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos_financeiros'] });
      queryClient.invalidateQueries({ queryKey: ['resumo_financeiro'] });
      toast.success('Todos os lançamentos foram excluídos com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir lançamentos:', error);
      toast.error('Erro ao excluir lançamentos. Tente novamente.');
    }
  });
  
  const [activeTab, setActiveTab] = useState('empresa');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
    action: 'promote' | 'demote' | 'delete' | 'delete_logo' | 'delete_categoria' | 'delete_all_lancamentos';
    logoType?: UploadType;
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
  const [categoriaDialog, setCategoriaDialog] = useState<{
    open: boolean;
    categoria?: any;
  }>({ open: false });
  
  const [importDialog, setImportDialog] = useState<{
    open: boolean;
    file: File | null;
    preview: any[];
    newCategorias: string[];
  }>({ open: false, file: null, preview: [], newCategorias: [] });
  
  const [passwordDialog, setPasswordDialog] = useState<{ open: boolean }>({ open: false });
  const [changingPassword, setChangingPassword] = useState(false);
  
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

  const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
    newPassword: z.string().min(6, 'Nova senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  });

  type PasswordFormData = z.infer<typeof passwordSchema>;

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleChangePassword = async (data: PasswordFormData) => {
    setChangingPassword(true);
    try {
      const { error } = await updatePassword(data.currentPassword, data.newPassword);
      
      if (error) {
        toast.error('Erro ao alterar senha: ' + error.message);
      } else {
        toast.success('Senha alterada com sucesso!');
        setPasswordDialog({ open: false });
        passwordForm.reset({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error: any) {
      toast.error('Erro ao alterar senha: ' + (error?.message || 'Erro desconhecido'));
    } finally {
      setChangingPassword(false);
    }
  };

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

  const handleDeleteLogo = (type: UploadType) => {
    setConfirmDialog({
      open: true,
      userId: '',
      userName: '',
      action: 'delete_logo',
      logoType: type
    });
  };

  const confirmDeleteLogo = async () => {
    if (!confirmDialog.logoType) return;
    
    await updateConfig.mutateAsync({
      id: config?.id,
      [confirmDialog.logoType === 'logo_sistema' ? 'logo_url' : 'logo_pdf_url']: null,
    });
    
    setConfirmDialog({ open: false, userId: '', userName: '', action: 'promote', logoType: undefined });
  };

  const onSubmitEditUser = async (data: EditUsuarioFormData) => {
    await updateUser.mutateAsync({
      userId: editDialog.userId,
      fullName: data.fullName,
    });
    setEditDialog({ open: false, userId: '', fullName: '' });
  };

  const handleCreateCategoria = async (categoria: any) => {
    await createCategoria.mutateAsync(categoria);
    setCategoriaDialog({ open: false });
    toast.success('Categoria criada com sucesso!');
  };

  const handleUpdateCategoria = async (categoria: any) => {
    await updateCategoria.mutateAsync({ id: categoriaDialog.categoria.id, ...categoria });
    setCategoriaDialog({ open: false });
    toast.success('Categoria atualizada com sucesso!');
  };

  const handleDeleteCategoria = async () => {
    await deleteCategoria.mutateAsync(confirmDialog.userId);
    setConfirmDialog({ open: false, userId: '', userName: '', action: 'promote' });
    toast.success('Categoria excluída com sucesso!');
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || 'U';
  };

  // Função para baixar modelo de planilha
  const handleDownloadModelo = () => {
    const modelo = [
      {
        'Data': '2024-01-15',
        'Tipo': 'receita',
        'Categoria': 'Vendas',
        'Descrição': 'Venda de produtos',
        'Valor': 1500.00,
        'Status': 'realizado',
        'Forma de Pagamento': 'Pix',
        'Observações': 'Cliente João Silva'
      },
      {
        'Data': '2024-01-16',
        'Tipo': 'despesa',
        'Categoria': 'Aluguel',
        'Descrição': 'Aluguel do escritório',
        'Valor': 2000.00,
        'Status': 'pendente',
        'Forma de Pagamento': 'Transferência',
        'Observações': 'Vencimento dia 30'
      },
      {
        'Data': '2024-01-17',
        'Tipo': 'despesa',
        'Categoria': 'Material de Escritório',
        'Descrição': 'Compra de materiais',
        'Valor': 350.50,
        'Status': 'realizado',
        'Forma de Pagamento': 'Cartão de Crédito',
        'Observações': 'Papel, canetas, etc.'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(modelo);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo');
    XLSX.writeFile(wb, 'modelo_lancamentos_financeiros.xlsx');
  };

  // Função para exportar lançamentos
  const handleExportLancamentos = () => {
    if (!lancamentosFinanceiros || lancamentosFinanceiros.length === 0) {
      toast.error('Não há lançamentos para exportar');
      return;
    }

    try {
      // Formatar dados para exportação no mesmo formato do modelo de importação
      const exportData = lancamentosFinanceiros.map(lancamento => ({
        'Data': lancamento.data_lancamento.split('T')[0],
        'Tipo': lancamento.tipo === 'receita' ? 'receita' : 'despesa',
        'Categoria': lancamento.categoria?.nome || '',
        'Descrição': lancamento.descricao || '',
        'Valor': lancamento.valor,
        'Status': lancamento.status === 'realizado' ? 'realizado' : 'pendente',
        'Forma de Pagamento': lancamento.forma_pagamento || '',
        'Observações': lancamento.observacoes || ''
      }));

      // Criar worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Definir largura das colunas
      ws['!cols'] = [
        { wch: 15 }, // Data
        { wch: 10 }, // Tipo
        { wch: 20 }, // Categoria
        { wch: 30 }, // Descrição
        { wch: 15 }, // Valor
        { wch: 12 }, // Status
        { wch: 20 }, // Forma de Pagamento
        { wch: 30 }, // Observações
      ];

      // Criar workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Lançamentos');

      // Gerar nome do arquivo com data atual
      const dataAtual = new Date();
      const dataFormatada = dataAtual.toISOString().split('T')[0];
      const nomeArquivo = `lancamentos_financeiros_${dataFormatada}.xlsx`;

      // Baixar arquivo
      XLSX.writeFile(wb, nomeArquivo);
      
      toast.success(`Exportação concluída! ${exportData.length} lançamentos exportados.`);
    } catch (error) {
      console.error('Erro ao exportar lançamentos:', error);
      toast.error('Erro ao exportar lançamentos. Tente novamente.');
    }
  };

  // Função para processar upload do arquivo
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<any>(sheet);

        // Validar estrutura do arquivo
        const requiredColumns = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Status'];
        const firstRow = jsonData[0] || {};
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));

        if (missingColumns.length > 0) {
          toast.error(`Colunas obrigatórias faltando: ${missingColumns.join(', ')}`);
          return;
        }

        // Processar dados
        const processedData = jsonData.map((row: any) => ({
          data: row['Data'],
          tipo: row['Tipo']?.toLowerCase() === 'receita' ? 'receita' : 'despesa',
          categoria: row['Categoria'],
          descricao: row['Descrição'] || '',
          valor: Number(row['Valor']) || 0,
          status: row['Status']?.toLowerCase() === 'realizado' ? 'realizado' : 'pendente',
          forma_pagamento: row['Forma de Pagamento'] || '',
          observacoes: row['Observações'] || ''
        }));

        // Identificar novas categorias
        const existingCategorias = categoriasFinanceiras || [];
        const newCategorias = processedData
          .map(row => row.categoria)
          .filter((cat: string) => cat && !existingCategorias.some(ec => ec.nome.toLowerCase() === cat.toLowerCase()))
          .filter((cat, idx, arr) => arr.indexOf(cat) === idx);

        setImportDialog({
          open: true,
          file,
          preview: processedData,
          newCategorias
        });

        toast.success(`Arquivo carregado com sucesso! ${processedData.length} registros encontrados.`);
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        toast.error('Erro ao processar o arquivo. Verifique se é um arquivo Excel válido.');
      }
    };

    reader.readAsBinaryString(file);
  };

  // Função para importar lançamentos
  const handleImportLancamentos = async () => {
    if (!importDialog.preview.length) return;

    try {
      // Criar novas categorias se necessário
      const existingCategorias = categoriasFinanceiras || [];
      const categoriaMap = new Map<string, string>();

      for (const catName of importDialog.newCategorias) {
        const tipo = importDialog.preview.find(row => row.categoria === catName)?.tipo || 'despesa';
        const cor = tipo === 'receita' ? '#22c55e' : '#ef4444';
        
        const newCategoria = await createCategoria.mutateAsync({
          nome: catName,
          tipo,
          descricao: `Categoria criada automaticamente na importação`,
          cor,
          ativo: true
        });

        categoriaMap.set(catName.toLowerCase(), newCategoria.id);
      }

      // Mapear categorias existentes
      existingCategorias.forEach(cat => {
        categoriaMap.set(cat.nome.toLowerCase(), cat.id);
      });

      // Importar lançamentos
      let successCount = 0;
      let errorCount = 0;

      for (const row of importDialog.preview) {
        try {
          const categoriaId = categoriaMap.get(row.categoria.toLowerCase());
          if (!categoriaId) {
            console.error(`Categoria não encontrada: ${row.categoria}`);
            errorCount++;
            continue;
          }

          await createLancamento.mutateAsync({
            tipo: row.tipo,
            categoria_id: categoriaId,
            descricao: row.descricao,
            valor: row.valor,
            data_lancamento: row.data,
            status: row.status,
            forma_pagamento: row.forma_pagamento,
            observacoes: row.observacoes,
            recorrente: false
          });

          successCount++;
        } catch (error) {
          console.error('Erro ao importar lançamento:', error);
          errorCount++;
        }
      }

      // Limpar e mostrar resultado
      setImportDialog({ open: false, file: null, preview: [], newCategorias: [] });
      
      if (errorCount === 0) {
        toast.success(`Importação concluída! ${successCount} lançamentos importados com sucesso.`);
      } else {
        toast.warning(`Importação concluída com avisos: ${successCount} importados, ${errorCount} com erro.`);
      }
    } catch (error) {
      console.error('Erro na importação:', error);
      toast.error('Erro ao importar lançamentos. Tente novamente.');
    }
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
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-5' : 'grid-cols-2'} lg:w-[1000px]`}>
          <TabsTrigger value="empresa" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="conta" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Minha Conta
          </TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger value="usuarios" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Usuários
              </TabsTrigger>
              <TabsTrigger value="categorias_financeiras" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Categorias
              </TabsTrigger>
              <TabsTrigger value="importar_lancamentos" className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Importar
              </TabsTrigger>
            </>
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
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setUploadDialog({ open: true, type: 'logo_sistema' })}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Alterar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteLogo('logo_sistema')}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </Button>
                          </div>
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
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setUploadDialog({ open: true, type: 'logo_pdf' })}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Alterar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteLogo('logo_pdf')}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </Button>
                          </div>
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Alterar Senha
              </CardTitle>
              <CardDescription>
                Altere sua senha de acesso ao sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setPasswordDialog({ open: true })}
              >
                <Key className="h-4 w-4 mr-2" />
                Alterar Senha
              </Button>
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

        {/* Categorias Financeiras Tab (Admin only) */}
        {isAdmin && (
          <TabsContent value="categorias_financeiras" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Gerenciar Categorias Financeiras
                </CardTitle>
                <CardDescription>
                  Crie e gerencie categorias para classificar receitas e despesas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[800px]">
                  <div className="space-y-4">
                    {loadingCategorias ? (
                      <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => (
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
                    ) : categoriasFinanceiras && categoriasFinanceiras.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Receitas */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold text-success flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <ArrowUpCircle className="h-5 w-5" />
                              Receitas
                            </div>
                            <Button
                              size="sm"
                              onClick={() => setCategoriaDialog({ open: true, categoria: { tipo: 'receita' } })}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Receita
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-[500px]">
                            <div className="space-y-3 pr-4">
                              {categoriasFinanceiras.filter(cat => cat.tipo === 'receita').map((cat) => (
                                <div
                                  key={cat.id}
                                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                  <div className="flex items-center gap-4">
                                    <div
                                      className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
                                      style={{ backgroundColor: cat.cor }}
                                    >
                                      <ArrowUpCircle className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate">{cat.nome}</p>
                                      <p className="text-sm text-muted-foreground truncate">{cat.descricao || 'Sem descrição'}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="default">
                                          Receita
                                        </Badge>
                                        {cat.exclusao_bloqueada && (
                                          <Badge variant="outline" className="text-xs">
                                            <Shield className="h-3 w-3 mr-1" />
                                            Bloqueada
                                          </Badge>
                                        )}
                                        <div className="flex items-center gap-1">
                                          <Palette className="h-3 w-3 text-muted-foreground" />
                                          <span className="text-xs text-muted-foreground">{cat.cor}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setCategoriaDialog({ open: true, categoria: cat })}
                                      disabled={updateCategoria.isPending || cat.exclusao_bloqueada}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => {
                                        setConfirmDialog({
                                          open: true,
                                          userId: cat.id,
                                          userName: cat.nome,
                                          action: 'delete_categoria'
                                        });
                                      }}
                                      disabled={deleteCategoria.isPending || cat.exclusao_bloqueada}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              {categoriasFinanceiras.filter(cat => cat.tipo === 'receita').length === 0 && (
                                <p className="text-center text-muted-foreground py-4">
                                  Nenhuma categoria de receita encontrada
                                </p>
                              )}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>

                      {/* Despesas */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold text-destructive flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <ArrowDownCircle className="h-5 w-5" />
                              Despesas
                            </div>
                            <Button
                              size="sm"
                              onClick={() => setCategoriaDialog({ open: true, categoria: { tipo: 'despesa' } })}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Despesa
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-[500px]">
                            <div className="space-y-3 pr-4">
                              {categoriasFinanceiras.filter(cat => cat.tipo === 'despesa').map((cat) => (
                                <div
                                  key={cat.id}
                                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                  <div className="flex items-center gap-4">
                                    <div
                                      className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
                                      style={{ backgroundColor: cat.cor }}
                                    >
                                      <ArrowDownCircle className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate">{cat.nome}</p>
                                      <p className="text-sm text-muted-foreground truncate">{cat.descricao || 'Sem descrição'}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="secondary">
                                          Despesa
                                        </Badge>
                                        {cat.exclusao_bloqueada && (
                                          <Badge variant="outline" className="text-xs">
                                            <Shield className="h-3 w-3 mr-1" />
                                            Bloqueada
                                          </Badge>
                                        )}
                                        <div className="flex items-center gap-1">
                                          <Palette className="h-3 w-3 text-muted-foreground" />
                                          <span className="text-xs text-muted-foreground">{cat.cor}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setCategoriaDialog({ open: true, categoria: cat })}
                                      disabled={updateCategoria.isPending || cat.exclusao_bloqueada}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => {
                                        setConfirmDialog({
                                          open: true,
                                          userId: cat.id,
                                          userName: cat.nome,
                                          action: 'delete_categoria'
                                        });
                                      }}
                                      disabled={deleteCategoria.isPending || cat.exclusao_bloqueada}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              {categoriasFinanceiras.filter(cat => cat.tipo === 'despesa').length === 0 && (
                                <p className="text-center text-muted-foreground py-4">
                                  Nenhuma categoria de despesa encontrada
                                </p>
                              )}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <DollarSign className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma categoria encontrada</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Importar Lançamentos Tab (Admin only) */}
        {isAdmin && (
          <TabsContent value="importar_lancamentos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  Importar Lançamentos Financeiros
                </CardTitle>
                <CardDescription>
                  Importe lançamentos financeiros de uma planilha Excel (.xlsx)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Botão de apagar todos os lançamentos */}
                <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg bg-destructive/5">
                  <div>
                    <h4 className="font-medium text-destructive mb-1">Zerar Lançamentos</h4>
                    <p className="text-sm text-muted-foreground">
                      Exclua todos os lançamentos financeiros do sistema
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setConfirmDialog({
                      open: true,
                      userId: '',
                      userName: '',
                      action: 'delete_all_lancamentos'
                    })}
                    disabled={deletingAllLancamentos}
                  >
                    {deletingAllLancamentos ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Excluindo...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Apagar Todos
                      </>
                    )}
                  </Button>
                </div>

                {/* Download do modelo e Exportar */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                    <div>
                      <h4 className="font-medium mb-1">Modelo de Planilha</h4>
                      <p className="text-sm text-muted-foreground">
                        Baixe o modelo para ver a estrutura de dados necessária
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleDownloadModelo()}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Modelo
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                    <div>
                      <h4 className="font-medium mb-1">Exportar Lançamentos</h4>
                      <p className="text-sm text-muted-foreground">
                        Exporte todos os lançamentos para um arquivo Excel
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleExportLancamentos}
                      disabled={!lancamentosFinanceiros || lancamentosFinanceiros.length === 0 || loadingLancamentos}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                  </div>
                </div>

                {/* Upload do arquivo */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium mb-1">Carregar Arquivo</h4>
                      <p className="text-sm text-muted-foreground">
                        Selecione um arquivo .xlsx com os lançamentos
                      </p>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    disabled={importDialog.open}
                    className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:text-foreground file:cursor-pointer"
                  />
                </div>

                {/* Preview dos dados */}
                {importDialog.preview.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium mb-1">Pré-visualização ({importDialog.preview.length} registros)</h4>
                        <p className="text-sm text-muted-foreground">
                          Verifique os dados antes de importar
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setImportDialog({ open: false, file: null, preview: [], newCategorias: [] })}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Limpar
                      </Button>
                    </div>

                    {/* Alerta de novas categorias */}
                    {importDialog.newCategorias.length > 0 && (
                      <div className="p-4 border border-warning bg-warning/10 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-medium text-warning mb-1">Novas categorias serão criadas</h5>
                            <p className="text-sm text-muted-foreground mb-2">
                              As seguintes categorias não existem no sistema e serão criadas automaticamente:
                            </p>
                            <ul className="text-sm list-disc list-inside space-y-1">
                              {importDialog.newCategorias.map((cat, idx) => (
                                <li key={idx}>{cat}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tabela de preview */}
                    <ScrollArea className="max-h-[400px] border rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="p-3 text-left font-medium">Data</th>
                            <th className="p-3 text-left font-medium">Tipo</th>
                            <th className="p-3 text-left font-medium">Categoria</th>
                            <th className="p-3 text-left font-medium">Descrição</th>
                            <th className="p-3 text-right font-medium">Valor</th>
                            <th className="p-3 text-left font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importDialog.preview.slice(0, 50).map((row, idx) => (
                            <tr key={idx} className="border-t hover:bg-muted/50">
                              <td className="p-3">{row.data}</td>
                              <td className="p-3">
                                <Badge variant={row.tipo === 'receita' ? 'default' : 'secondary'}>
                                  {row.tipo}
                                </Badge>
                              </td>
                              <td className="p-3">{row.categoria}</td>
                              <td className="p-3">{row.descricao}</td>
                              <td className="p-3 text-right font-medium">
                                {row.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </td>
                              <td className="p-3">
                                <Badge variant={row.status === 'realizado' ? 'default' : 'outline'}>
                                  {row.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                          {importDialog.preview.length > 50 && (
                            <tr>
                              <td colSpan={6} className="p-3 text-center text-muted-foreground">
                                ... e mais {importDialog.preview.length - 50} registros
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </ScrollArea>

                    {/* Botão de importação */}
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setImportDialog({ open: false, file: null, preview: [], newCategorias: [] })}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleImportLancamentos}
                        disabled={createLancamento.isPending || createCategoria.isPending}
                      >
                        {createLancamento.isPending || createCategoria.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Importando...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Importar {importDialog.preview.length} Lançamentos
                          </>
                        )}
                      </Button>
                    </div>
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
            <AlertDialogTitle className="flex items-center gap-2">
              {confirmDialog.action === 'delete' && (
                <>
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Excluir Usuário
                </>
              )}
              {confirmDialog.action === 'delete_logo' && (
                <>
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Excluir Logomarca
                </>
              )}
              {confirmDialog.action === 'promote' && 'Promover a Administrador'}
              {confirmDialog.action === 'demote' && 'Rebaixar para Usuário'}
              {confirmDialog.action === 'delete_categoria' && (
                <>
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Excluir Categoria
                </>
              )}
              {confirmDialog.action === 'delete_all_lancamentos' && (
                <>
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Apagar Todos os Lançamentos
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'delete'
                ? `Tem certeza que deseja excluir "${confirmDialog.userName}"? Esta ação não pode ser desfeita e removerá todos os dados do usuário do sistema.`
                : confirmDialog.action === 'delete_logo'
                  ? `Tem certeza que deseja excluir a logomarca ${confirmDialog.logoType === 'logo_sistema' ? 'do Sistema' : 'do Orçamento'}? Esta ação não pode ser desfeita.`
                  : confirmDialog.action === 'delete_categoria'
                    ? `Tem certeza que deseja excluir a categoria "${confirmDialog.userName}"? Esta ação não pode ser desfeita.`
                    : confirmDialog.action === 'delete_all_lancamentos'
                      ? `Tem certeza que deseja apagar TODOS os lançamentos financeiros do sistema? Esta ação NÃO pode ser desfeita e removerá permanentemente todos os registros de receitas e despesas.`
                      : confirmDialog.action === 'promote'
                      ? `Tem certeza que deseja promover "${confirmDialog.userName}" a administrador? Administradores têm acesso total ao sistema, incluindo valores financeiros e gerenciamento de usuários.`
                      : `Tem certeza que deseja rebaixar "${confirmDialog.userName}" para usuário comum? O usuário perderá acesso a funcionalidades administrativas.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={
                confirmDialog.action === 'delete' ? confirmDeleteUser :
                confirmDialog.action === 'delete_logo' ? confirmDeleteLogo :
                confirmDialog.action === 'delete_categoria' ? handleDeleteCategoria :
                confirmDialog.action === 'delete_all_lancamentos' ? () => deleteAllLancamentos() :
                confirmRoleChange
              }
              className={(confirmDialog.action === 'delete' || confirmDialog.action === 'delete_logo' || confirmDialog.action === 'delete_categoria' || confirmDialog.action === 'delete_all_lancamentos') ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {(updateUserRole.isPending || deleteUser.isPending || updateConfig.isPending || deletingAllLancamentos) ? (
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

      {/* Categoria Financeira Dialog */}
      <Dialog open={categoriaDialog.open} onOpenChange={(open) => setCategoriaDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {categoriaDialog.categoria?.id ? (
                <>
                  <Edit className="h-5 w-5 text-primary" />
                  Editar Categoria
                </>
              ) : categoriaDialog.categoria?.tipo === 'receita' ? (
                <>
                  <Plus className="h-5 w-5 text-primary" />
                  Nova Receita
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-primary" />
                  Nova Despesa
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {categoriaDialog.categoria?.id
                ? 'Atualize as informações da categoria financeira'
                : categoriaDialog.categoria?.tipo === 'receita'
                  ? 'Preencha os dados para criar uma nova categoria de receita'
                  : 'Preencha os dados para criar uma nova categoria de despesa'
              }
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const categoria = {
                nome: formData.get('nome') as string,
                tipo: formData.get('tipo') as 'receita' | 'despesa',
                descricao: formData.get('descricao') as string,
                cor: formData.get('cor') as string,
                ativo: true,
              };
              
              if (categoriaDialog.categoria) {
                handleUpdateCategoria(categoria);
              } else {
                handleCreateCategoria(categoria);
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="cat_nome">Nome *</Label>
              <Input
                id="cat_nome"
                name="nome"
                defaultValue={categoriaDialog.categoria?.nome || ''}
                placeholder="Ex: Aluguel, Vendas, Salários"
                required
              />
            </div>

            {!categoriaDialog.categoria?.id && (
              <input
                type="hidden"
                name="tipo"
                value={categoriaDialog.categoria?.tipo || 'receita'}
              />
            )}
            {categoriaDialog.categoria?.id && (
              <div className="space-y-2">
                <Label htmlFor="cat_tipo">Tipo *</Label>
                <Select
                  name="tipo"
                  defaultValue={categoriaDialog.categoria?.tipo}
                  disabled
                >
                  <SelectTrigger id="cat_tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  O tipo não pode ser alterado em categorias existentes
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="cat_descricao">Descrição</Label>
              <Textarea
                id="cat_descricao"
                name="descricao"
                defaultValue={categoriaDialog.categoria?.descricao || ''}
                placeholder="Descrição opcional da categoria"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat_cor">Cor *</Label>
              <div className="flex gap-2">
                <Input
                  id="cat_cor"
                  name="cor"
                  type="color"
                  defaultValue={categoriaDialog.categoria?.cor || '#22c55e'}
                  className="w-20 h-10 p-1"
                  required
                />
                <Input
                  type="text"
                  defaultValue={categoriaDialog.categoria?.cor || '#22c55e'}
                  placeholder="#22c55e"
                  className="flex-1"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  title="Formato hexadecimal: #RRGGBB"
                  onChange={(e) => {
                    const input = document.getElementById('cat_cor') as HTMLInputElement;
                    if (input && /^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      input.value = e.target.value;
                    }
                  }}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCategoriaDialog({ open: false })}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createCategoria.isPending || updateCategoria.isPending}
              >
                {createCategoria.isPending || updateCategoria.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : categoriaDialog.categoria?.id ? (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Atualizar
                  </>
                ) : categoriaDialog.categoria?.tipo === 'receita' ? (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Criar Receita
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Criar Despesa
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialog.open} onOpenChange={(open) => setPasswordDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Alterar Senha
            </DialogTitle>
            <DialogDescription>
              Digite sua senha atual e a nova senha para alterar
            </DialogDescription>
          </DialogHeader>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha Atual *</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Digite sua senha atual"
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha *</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Digite a nova senha"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Mínimo 6 caracteres
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Nova Senha *</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirme a nova senha"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPasswordDialog({ open: false })}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={changingPassword}>
                  {changingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Alterando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Alterar Senha
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
