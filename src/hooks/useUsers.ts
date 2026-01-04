import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, UserRole, UserProfile } from '@/lib/supabase';
import { toast } from 'sonner';

interface UserWithRole extends UserProfile {
  role: UserRole;
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
      
      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        return {
          ...profile,
          role: (userRole?.role as UserRole) || 'user',
        };
      });

      return usersWithRoles;
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password, fullName, role }: { email: string; password: string; fullName: string; role: UserRole }) => {
      // Create user in Supabase Auth - o profile será criado automaticamente pelo trigger
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) throw new Error('Falha ao criar usuário');

      // Aguardar um momento para o trigger criar o profile
      await new Promise(resolve => setTimeout(resolve, 500));

      // Set user role usando a função SECURITY DEFINER que bypassa o RLS
      const { error: roleError } = await supabase.rpc('create_user_role', {
        p_user_id: authData.user.id,
        p_role: role,
      });

      if (roleError) throw roleError;

      return authData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário criado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error creating user:', error);
      toast.error(`Erro ao criar usuário: ${error.message || 'Erro desconhecido'}`);
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, fullName, email }: { userId: string; fullName?: string; email?: string }) => {
      console.log('Atualizando usuário:', { userId, fullName, email });
      
      // Atualizar profile do usuário (apenas full_name)
      const updates: any = {};
      if (fullName !== undefined) updates.full_name = fullName;

      if (Object.keys(updates).length > 0) {
        console.log('Atualizando profile com:', updates);
        const { error: profileError } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', userId);

        if (profileError) {
          console.error('Erro ao atualizar profile:', profileError);
          throw profileError;
        }
      }

      // Atualizar o display name no Supabase Auth usando uma função RPC
      // Isso atualiza o raw_user_meta_data->>'full_name'
      if (fullName !== undefined) {
        console.log('Atualizando display name no Supabase Auth para:', fullName);
        const { error: authError } = await supabase.rpc('update_user_metadata', {
          p_user_id: userId,
          p_full_name: fullName,
        });

        if (authError) {
          console.warn('Não foi possível atualizar o display name no Supabase Auth:', authError);
          // Não lançar erro, pois a atualização do profile foi bem-sucedida
        }
      }

      // Nota: O email não pode ser atualizado diretamente pela API do cliente
      // Para atualizar o email, seria necessário usar a API admin do Supabase
      // Por enquanto, apenas o nome pode ser editado
      if (email !== undefined) {
        console.warn('Atualização de email não é suportada pela API do cliente do Supabase');
        throw new Error('A atualização de email não é suportada. Para alterar o email, o usuário deve fazer isso nas configurações da conta.');
      }

      return { userId, fullName };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário atualizado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error updating user:', error);
      toast.error(`Erro ao atualizar usuário: ${error.message || 'Erro desconhecido'}`);
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      console.log('Iniciando exclusão do usuário:', userId);
      // Deletar usuário usando a função RPC que deleta do auth.users (CASCADE deleta profile e user_roles)
      const { data, error } = await supabase.rpc('delete_user', {
        p_user_id: userId,
      });

      console.log('Resultado da exclusão:', { data, error });

      if (error) throw error;

      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário excluído com sucesso!', {
        duration: 5000,
      });
    },
    onError: (error: any) => {
      console.error('Error deleting user:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast.error(`Erro ao excluir usuário: ${error.message || 'Erro desconhecido'}`, {
        duration: 10000,
      });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: UserRole }) => {
      // Atualizar role usando a função SECURITY DEFINER que bypassa o RLS
      const { error } = await supabase.rpc('create_user_role', {
        p_user_id: userId,
        p_role: newRole,
      });
      
      if (error) throw error;

      return { userId, newRole };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`Usuário ${data.newRole === 'admin' ? 'promovido a admin' : 'rebaixado para usuário'}`);
    },
    onError: (error) => {
      console.error('Error updating user role:', error);
      toast.error('Erro ao atualizar permissão do usuário');
    },
  });
}