-- Migration: 0012_member_profiles.sql
-- Crea tabla public.profiles vinculada a auth.users para identidad legible.
-- Requiere un trigger en Supabase que cree/actualice el perfil ante cambios en auth.users(email, ...)
-- o delegar la creación en la aplicación al momento del registro.
--
-- Por ahora creamos la tabla y permitimos a dueños/admins leer todos los perfiles, 
-- y a cualquier autenticado leer el suyo o el de miembros de su organización.

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Perfiles legibles por organización" ON public.profiles;
CREATE POLICY "Perfiles legibles por organización" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    -- Perfil propio
    id = auth.uid()
    OR
    -- Perfiles de miembros de organizaciones comunes
    id IN (
      SELECT m_other.user_id
      FROM public.organization_members m_me
      JOIN public.organization_members m_other 
        ON m_me.organization_id = m_other.organization_id
      WHERE m_me.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Solo dueño puede crear/actualizar su perfil" ON public.profiles;
CREATE POLICY "Solo dueño puede crear/actualizar su perfil" ON public.profiles
  FOR ALL TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

NOTIFY pgrst, 'reload schema';
