# Configuração do Banco de Dados - Experimente Pro

Este documento contém as instruções para configurar as tabelas necessárias no Supabase.

## Tabelas a Criar

### 1. Tabela `configuracao_empresa`

Esta tabela armazena as configurações da empresa (nome, telefone, email, logos, etc.).

#### Como criar no Supabase:

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (ícone de terminal no menu lateral)
4. Copie e execute o SQL abaixo:

```sql
-- Tabela de configuração da empresa
CREATE TABLE IF NOT EXISTS public.configuracao_empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_empresa TEXT NOT NULL,
  logo_url TEXT,
  logo_pdf_url TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  validade_orcamento_dias INTEGER NOT NULL DEFAULT 30,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.configuracao_empresa ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública (configuração única da empresa)
CREATE POLICY "Permitir leitura pública"
  ON public.configuracao_empresa
  FOR SELECT
  TO public
  USING (true);

-- Política para permitir inserção apenas para usuários autenticados
CREATE POLICY "Permitir inserção para autenticados"
  ON public.configuracao_empresa
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para permitir atualização apenas para usuários autenticados
CREATE POLICY "Permitir atualização para autenticados"
  ON public.configuracao_empresa
  FOR UPDATE
  TO authenticated
  USING (true);

-- Criar índice para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_configuracao_empresa_updated_at 
  ON public.configuracao_empresa(updated_at DESC);

-- Inserir configuração padrão
INSERT INTO public.configuracao_empresa (nome_empresa, validade_orcamento_dias)
VALUES ('Minha Empresa', 30)
ON CONFLICT DO NOTHING;
```

### 2. Tabela `profiles`

Esta tabela armazena os perfis dos usuários.

#### Como criar no Supabase:

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (ícone de terminal no menu lateral)
4. Copie e execute o SQL abaixo:

```sql
-- Tabela de profiles dos usuários
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();
```

### 3. Tabela `user_roles`

Esta tabela armazena os papéis (roles) dos usuários (admin ou user).

#### Como criar no Supabase:

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (ícone de terminal no menu lateral)
4. Copie e execute o SQL abaixo:

```sql
-- Tabela de roles dos usuários
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Criar índice para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função SECURITY DEFINER para criar roles (bypass RLS)
CREATE OR REPLACE FUNCTION public.create_user_role(p_user_id UUID, p_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id) DO UPDATE SET role = p_role;
END;
$$;

-- Política para permitir leitura para todos os usuários autenticados
CREATE POLICY "Permitir leitura de user_roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para permitir inserção para administradores
CREATE POLICY "Permitir inserção de user_roles para admins"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Política para permitir atualização para administradores
CREATE POLICY "Permitir atualização de user_roles para admins"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Política para permitir que usuários leiam seu próprio role
CREATE POLICY "Permitir leitura do próprio role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

### 4. Trigger para criar profile automaticamente

Este trigger cria automaticamente o profile quando um usuário é criado no Supabase Auth.

#### Como criar no Supabase:

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (ícone de terminal no menu lateral)
4. Copie e execute o SQL abaixo:

```sql
-- Função para criar profile automaticamente quando um usuário é criado no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para chamar a função quando um usuário for criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Permitir inserção do próprio profile" ON public.profiles;
DROP POLICY IF EXISTS "Permitir atualização do próprio profile" ON public.profiles;
DROP POLICY IF EXISTS "Permitir leitura de profiles" ON public.profiles;

-- Política para permitir que usuários autenticados atualizem seu próprio profile
CREATE POLICY "Permitir atualização do próprio profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política para permitir leitura para todos os usuários autenticados
CREATE POLICY "Permitir leitura de profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);
```

### 5. Função para deletar usuário

Esta função permite deletar usuários do Supabase Auth (o que também deleta o profile e user_roles devido ao CASCADE).

#### Como criar no Supabase:

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (ícone de terminal no menu lateral)
4. Copie e execute o SQL abaixo:

```sql
-- Função para deletar usuário do Auth (requer SECURITY DEFINER)
-- Esta função deleta o usuário do auth.users, o que em cascade deleta o profile e user_roles
CREATE OR REPLACE FUNCTION public.delete_user(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deletar do auth.users (CASCADE vai deletar profile e user_roles)
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

-- Grant permissão para usuários autenticados executarem a função
GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;
```

### 6. Verificar outras tabelas

Certifique-se de que as seguintes tabelas existem no seu banco de dados:

- `clientes`
- `setores_cliente`
- `categorias`
- `produtos`
- `checklist_itens`
- `orcamentos`
- `itens_orcamento`
- `pedidos`
- `itens_pedido`

Você pode verificar as tabelas existentes no painel do Supabase em **Table Editor**.

## Upload de Arquivos

Para o sistema de upload de logos funcionar em desenvolvimento:

1. O plugin Vite em [`src/lib/uploadPlugin.ts`](src/lib/uploadPlugin.ts:1) cria um endpoint `/api/upload`
2. Os arquivos são salvos na pasta `public/uploads` do projeto
3. **Importante**: Você precisa reiniciar o servidor de desenvolvimento (`npm run dev`) após adicionar o plugin ao [`vite.config.ts`](vite.config.ts:1)

Para produção, você precisará configurar um servidor backend para lidar com os uploads ou usar o Supabase Storage.

## Variáveis de Ambiente

Certifique-se de que o arquivo `.env` contém as variáveis necessárias:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

## Permissões RLS

As políticas RLS (Row Level Security) controlam quem pode acessar cada tabela. Certifique-se de que:

1. A autenticação está configurada no Supabase
2. As políticas RLS permitem o acesso necessário para cada tabela
3. Os usuários têm os papéis (roles) corretos no sistema
