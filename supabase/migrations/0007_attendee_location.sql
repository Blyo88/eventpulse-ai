-- Sprint 7: Coordenadas anónimas para mapa de calor ético
ALTER TABLE "attendees"
ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION;

COMMENT ON COLUMN "attendees"."latitude" IS 'Latitud anonimizada del asistente/staff para el mapa de calor';
COMMENT ON COLUMN "attendees"."longitude" IS 'Longitud anonimizada del asistente/staff para el mapa de calor';
