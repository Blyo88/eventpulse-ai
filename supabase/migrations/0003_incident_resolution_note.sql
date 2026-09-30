-- Migration: 0003_incident_resolution_note.sql
-- Añade la columna resolution_note a la tabla de incidentes

ALTER TABLE public.incidents 
ADD COLUMN IF NOT EXISTS resolution_note TEXT;

NOTIFY pgrst, 'reload schema';