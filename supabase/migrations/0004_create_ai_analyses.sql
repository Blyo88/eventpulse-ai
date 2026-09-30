-- Migration: 0004_create_ai_analyses.sql
-- Añade tabla para persistir el análisis de IA

CREATE TABLE IF NOT EXISTS public.ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE UNIQUE,
  selected_photo_urls TEXT[] NOT NULL DEFAULT '{}',
  generated_copy TEXT NOT NULL,
  ai_score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

NOTIFY pgrst, 'reload schema';
