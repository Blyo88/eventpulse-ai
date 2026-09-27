# Technical Specifications
# EventPulse AI

**Versión:** 1.0  
**Fecha:** Septiembre 2026  
**Arquitectura:** SaaS Serverless — Next.js + Supabase + Gemini API

---

## 1. Stack Tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Frontend | Next.js 14+ (App Router) | Rendimiento, SSR/SSG, rutas tipadas |
| Lenguaje | TypeScript (strict mode) | Seguridad de tipos, cero `any` |
| Estilos | Tailwind CSS | Utilidades Mobile-First, rapidez de prototipado |
| Componentes UI | Shadcn UI | Accesibles, personalizables, basados en Radix |
| Base de Datos | Supabase (PostgreSQL) | Relacional, RLS, tiempo real via Realtime |
| Autenticación | Supabase Auth | JWT, OAuth, MagicLink out-of-the-box |
| Almacenamiento | Supabase Storage | Fotos de eventos, políticas por bucket |
| Motor IA (texto) | Google Gemini 1.5 Flash/Pro API | Generación de copys, recaps narrativos |
| Motor IA (visión) | Google Gemini 1.5 Pro Vision API | Scoring y clasificación de fotografías |
| Despliegue | Vercel | Edge Functions, CI/CD automático, 99.9% uptime |
| Validación de tipos | TypeScript (`tsc --noEmit`) | Obligatoria antes de cada commit |
| Linter / Formatter | Biome | Análisis estático + formateo en un solo paso |

---

## 2. Esquema de Base de Datos

### Tabla: `events`
```sql
CREATE TABLE events (
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
```

### Tabla: `attendees`
```sql
CREATE TABLE attendees (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  email           TEXT NOT NULL,
  registered_via  TEXT DEFAULT 'manual',
  checked_in      BOOLEAN NOT NULL DEFAULT false,
  checked_in_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, email)
);
```

### Tabla: `incidents`
```sql
CREATE TABLE incidents (
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
```

### Tabla: `photos`
```sql
CREATE TABLE photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  storage_url TEXT NOT NULL,
  ai_score    INTEGER CHECK (ai_score BETWEEN 0 AND 100),
  category    TEXT CHECK (category IN ('stage', 'audience', 'networking', 'branding', 'other')),
  is_selected BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Row Level Security (RLS)
```sql
-- Cada organizador solo ve sus propios eventos
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_only" ON events
  USING (auth.uid() = user_id);

-- Los asistentes de un evento solo los ve su organizador
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_owner_only" ON attendees
  USING (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));

-- Igual para incidents y photos
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_owner_only" ON incidents
  USING (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_owner_only" ON photos
  USING (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));
```

---

## 3. Arquitectura de Carpetas (Next.js App Router)

```
eventpulse-ai/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── events/
│   │   │   ├── page.tsx              # Lista de eventos
│   │   │   ├── new/page.tsx          # Crear evento
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Detalle del evento
│   │   │       ├── attendees/page.tsx
│   │   │       ├── incidents/page.tsx
│   │   │       ├── photos/page.tsx
│   │   │       └── recap/page.tsx
│   ├── checkin/[eventId]/page.tsx    # PWA pública de check-in
│   ├── upload/[eventId]/page.tsx     # Enlace público subida de fotos
│   └── api/
│       ├── webhooks/forms/route.ts   # Receptor de webhooks externos
│       ├── ai/copys/route.ts         # Server Action: generar copys
│       ├── ai/photos/route.ts        # Server Action: analizar fotos
│       └── ai/recap/route.ts         # Server Action: generar recap
├── components/
│   ├── ui/                           # Componentes Shadcn (auto-generados)
│   ├── events/
│   ├── attendees/
│   ├── incidents/
│   └── photos/
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Cliente browser
│   │   └── server.ts                 # Cliente server (cookies)
│   ├── gemini/
│   │   ├── copys.ts                  # Prompts para generación de texto
│   │   └── vision.ts                 # Prompts para análisis de fotos
│   └── utils.ts
├── types/
│   └── supabase.ts                   # Tipos auto-generados por Supabase CLI
├── docs/
│   ├── PRD.md
│   └── TECH_SPEC.md
└── supabase/
    └── migrations/
        └── 0001_initial_schema.sql
```

---

## 4. Reglas de Calidad (ISO/IEC 25010)

### 4.1 Tipado Estricto
- `tsconfig.json` con `"strict": true` obligatorio.
- **Cero uso de `any`**. Usar `unknown` + type guards cuando el tipo no sea conocido.
- Todos los tipos de base de datos deben provenir de `types/supabase.ts` generado con:
  ```bash
  npx supabase gen types typescript --local > types/supabase.ts
  ```
- Ejecutar antes de todo commit:
  ```bash
  npx tsc --noEmit
  ```

### 4.2 Separación Client / Server
| Tipo | Regla |
|------|-------|
| `"use client"` | Solo para componentes con estado (`useState`, `useEffect`, handlers de eventos) |
| Server Actions | Toda lógica de base de datos y llamadas a APIs externas (Gemini) |
| API Routes | Webhooks externos (Google Forms, Typeform) y endpoints públicos |
| `"use server"` | Explícito en cada Server Action |

### 4.3 Mobile-First (PWA para Live Ops)
- Las vistas `/checkin/[eventId]` y `/upload/[eventId]` son PWA.
- Breakpoints: diseño base en 360px, tablet en 768px, desktop en 1024px.
- Agregar en `app/checkin/[eventId]/layout.tsx`:
  ```tsx
  export const metadata = {
    manifest: '/manifest.json',
    themeColor: '#1A56DB',
  }
  ```
- Caché offline con Service Worker para el módulo de check-in.

### 4.4 Manejo de Errores
- Toda Server Action retorna `{ data, error }` — nunca lanza excepciones sin capturar.
- Errores de Supabase se loguean con contexto (event_id, user_id) sin exponer datos sensibles.
- Las llamadas a Gemini API tienen timeout de 15 segundos y retry con backoff exponencial (máx. 3 intentos).

### 4.5 Variables de Entorno
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```
- Las variables `NEXT_PUBLIC_` son seguras para el cliente.
- `SUPABASE_SERVICE_ROLE_KEY` y `GEMINI_API_KEY` **solo en servidor**, nunca expuestas al cliente.

---

## 5. Flujo de Datos por Módulo

### Módulo 1 — Webhook de inscripción
```
Google Forms → POST /api/webhooks/forms → validar payload → upsert attendees → Supabase Realtime → UI actualiza tabla
```

### Módulo 2 — Check-in
```
Staff escanea QR → /checkin/[eventId] → Server Action: update attendees.checked_in = true → Supabase Realtime → Dashboard actualiza Show-up Rate
```

### Módulo 3 — Análisis de fotos
```
Upload foto → compress (browser) → Supabase Storage → POST /api/ai/photos → Gemini Vision (score + category) → update photos → Gallery muestra ranking
```

### Módulo 4 — Recap
```
Click "Generar Recap" → POST /api/ai/recap → consulta [attendees + incidents + photos TOP15] → prompt Gemini → retorna texto → editor previo a publicar
```

---

## 6. Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar en desarrollo
npm run dev

# Verificar tipos (obligatorio antes de commit)
npx tsc --noEmit

# Linter + formatter
npx @biomejs/biome check --apply ./src

# Generar tipos de Supabase
npx supabase gen types typescript --local > types/supabase.ts

# Aplicar migraciones
npx supabase db push
```
