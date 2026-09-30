-- Migration: 0002_storage_bucket.sql
-- Crea el bucket event_photos en Supabase Storage y configura las políticas RLS

-- Crear bucket event_photos (público para lectura de URLs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event_photos',
  'event_photos',
  true,
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─────────────────────────────────────────
-- Políticas de Storage para event_photos
-- ─────────────────────────────────────────

-- Lectura pública (URLs públicas funcionan sin auth)
DROP POLICY IF EXISTS "event_photos_public_read" ON storage.objects;
CREATE POLICY "event_photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event_photos');

-- Subida solo para usuarios autenticados
DROP POLICY IF EXISTS "event_photos_auth_insert" ON storage.objects;
CREATE POLICY "event_photos_auth_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'event_photos'
    AND auth.role() = 'authenticated'
  );

-- Eliminación solo del propietario del objeto
DROP POLICY IF EXISTS "event_photos_auth_delete" ON storage.objects;
CREATE POLICY "event_photos_auth_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'event_photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

NOTIFY pgrst, 'reload schema';
