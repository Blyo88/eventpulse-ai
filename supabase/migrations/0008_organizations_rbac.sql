-- 1. Enums de Roles RBAC
CREATE TYPE "org_role" AS ENUM ('owner', 'admin', 'editor', 'spectator');

-- 2. Tabla de Organizaciones (Tenants)
CREATE TABLE "organizations" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabla de Miembros
CREATE TABLE "organization_members" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "organization_id" UUID REFERENCES "organizations" ("id") ON DELETE CASCADE NOT NULL,
    "user_id" UUID REFERENCES auth.users ("id") ON DELETE CASCADE NOT NULL,
    "role" "org_role" DEFAULT 'spectator' NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE("organization_id", "user_id")
);

-- 4. Adaptar Events para Multi-tenant
ALTER TABLE "events" ADD COLUMN "organization_id" UUID REFERENCES "organizations" ("id") ON DELETE CASCADE;

-- 5. Crear org por defecto para el usuario existente (Ejecutar solo si se sabe el contexto)
-- Suponiendo que el usuario actual ya existe, deberías vincular sus eventos.
-- Esta migración asume que crearemos una org por defecto.

-- 6. Habilitar RLS en todas las tablas críticas
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attendees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "incidents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "photos" ENABLE ROW LEVEL SECURITY;

-- 7. Políticas RLS (Ejemplo para Events)
CREATE POLICY "Users can only access events in their organization" ON "events"
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );
