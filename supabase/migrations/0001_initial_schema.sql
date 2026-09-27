-- EventPulse AI — Initial Schema
-- Migration: 0001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────
-- TABLE: events
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  date        TIMESTAMPTZ NOT NULL,
  location    TEXT,
  capacity    INTEGER NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'active', 'finished', 'archived')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────
-- TABLE: attendees
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendees (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  email           TEXT NOT NULL,
  registered_via  TEXT NOT NULL DEFAULT 'manual',
  checked_in      BOOLEAN NOT NULL DEFAULT false,
  checked_in_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, email)
);

-- ─────────────────────────────────────────
-- TABLE: incidents
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS incidents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  category    TEXT NOT NULL
                CHECK (category IN ('logistics', 'capacity', 'hardware', 'software', 'other')),
  severity    TEXT NOT NULL
                CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  resolved    BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────
-- TABLE: photos
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  storage_url TEXT NOT NULL,
  ai_score    INTEGER CHECK (ai_score BETWEEN 0 AND 100),
  category    TEXT CHECK (category IN ('stage', 'audience', 'networking', 'branding', 'other')),
  is_selected BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
ALTER TABLE events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos    ENABLE ROW LEVEL SECURITY;

-- Dev policies: owner-only access
CREATE POLICY "events_owner_only" ON events
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "attendees_event_owner" ON attendees
  USING (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()))
  WITH CHECK (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));

CREATE POLICY "incidents_event_owner" ON incidents
  USING (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()))
  WITH CHECK (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));

CREATE POLICY "photos_event_owner" ON photos
  USING (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()))
  WITH CHECK (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));

-- ─────────────────────────────────────────
-- AUTO-UPDATE updated_at on events
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
