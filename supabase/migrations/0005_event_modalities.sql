-- Sprint 7: Añadir modalidad virtual, check-in y mapa de calor
ALTER TABLE "events"
ADD COLUMN "is_virtual" BOOLEAN DEFAULT FALSE,
ADD COLUMN "enable_check_in" BOOLEAN DEFAULT FALSE,
ADD COLUMN "enable_location_heat_map" BOOLEAN DEFAULT FALSE;

-- Añadir comentario para seguimiento en el esquema
COMMENT ON COLUMN "events"."is_virtual" IS 'Define si el evento es virtual (true) o presencial (false)';
COMMENT ON COLUMN "events"."enable_check_in" IS 'Habilita la generación de QR/enlaces de ingreso';
COMMENT ON COLUMN "events"."enable_location_heat_map" IS 'Habilita la recolección opcional y anónima de ubicación';