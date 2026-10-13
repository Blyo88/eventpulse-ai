-- Sprint 7: Añadir access_token a asistentes para QR/Enlaces únicos
ALTER TABLE "attendees"
ADD COLUMN "access_token" UUID DEFAULT gen_random_uuid();

-- Crear índice para validaciones rápidas
CREATE INDEX "attendees_access_token_idx" ON "attendees" ("access_token");