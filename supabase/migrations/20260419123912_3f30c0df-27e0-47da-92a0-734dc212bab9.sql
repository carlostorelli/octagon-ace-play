-- ============================================
-- 1. BLOQUEAR PRIVILEGE ESCALATION EM user_roles
-- ============================================
-- Remove a policy ALL existente e recria policies separadas por operação
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Apenas admins podem inserir roles
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem atualizar roles
CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem deletar roles
CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins podem ver todos os roles (a policy "Users can view own roles" continua existindo)
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 2. RESTRINGIR LISTAGEM DOS BUCKETS PÚBLICOS
-- ============================================
-- Remove policies amplas existentes em storage.objects para os buckets públicos
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view fighter photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view site assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view event pdfs" ON storage.objects;

-- Permitir apenas leitura por nome de arquivo específico (impede listagem)
-- A leitura ainda funciona via URL pública direta porque o Supabase serve via path completo
CREATE POLICY "Public file access by name only - avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars' AND name IS NOT NULL);

CREATE POLICY "Public file access by name only - fighter-photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'fighter-photos' AND name IS NOT NULL);

CREATE POLICY "Public file access by name only - site-assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'site-assets' AND name IS NOT NULL);

CREATE POLICY "Public file access by name only - event-pdfs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'event-pdfs' AND name IS NOT NULL);