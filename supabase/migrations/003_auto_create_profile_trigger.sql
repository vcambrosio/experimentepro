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

-- Atualizar política RLS para permitir inserções via trigger (bypass RLS)
-- A trigger usa SECURITY DEFINER, então ela pode inserir mesmo com RLS ativo

-- Política para permitir que usuários autenticados atualizem seu próprio profile
DROP POLICY IF EXISTS "Permitir atualização do próprio profile" ON public.profiles;

CREATE POLICY "Permitir atualização do próprio profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política para permitir leitura para todos os usuários autenticados
DROP POLICY IF EXISTS "Permitir leitura de profiles" ON public.profiles;

CREATE POLICY "Permitir leitura de profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Remover a política de inserção manual, pois o trigger cuida disso
DROP POLICY IF EXISTS "Permitir inserção do próprio profile" ON public.profiles;
