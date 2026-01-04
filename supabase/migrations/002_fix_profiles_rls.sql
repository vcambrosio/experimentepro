-- Habilitar RLS na tabela profiles (se ainda não estiver habilitado)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Permitir inserção do próprio profile" ON public.profiles;
DROP POLICY IF EXISTS "Permitir atualização do próprio profile" ON public.profiles;
DROP POLICY IF EXISTS "Permitir leitura de profiles" ON public.profiles;

-- As novas políticas serão criadas na migration 003_auto_create_profile_trigger.sql
