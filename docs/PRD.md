# Product Requirements Document (PRD)
# EventPulse AI

**Versión:** 1.0  
**Fecha:** Septiembre 2026  
**Tipo de Producto:** SaaS B2B All-in-One  
**Estado:** En desarrollo

---

## 1. Visión del Producto

### Problema Central
La organización de eventos tecnológicos (talleres, meetups, comunidades como Read IA) sufre de una fragmentación crítica de herramientas:

- **Pre-evento:** Google Forms desconectado de Excel, copys redactados a mano y sin calendario de difusión.
- **Durante el evento:** Listas de acceso en papel, incidencias perdidas en WhatsApp, sin visibilidad de aforo en tiempo real.
- **Post-evento:** Cientos de fotos desordenadas en Drive, horas de selección manual, resúmenes redactados desde cero sin datos.

### Solución
EventPulse AI es un **copiloto inteligente para organizadores** que automatiza el ciclo de vida completo del evento aplicando IA en tres fases: captación, operación en vivo y curaduría de contenido.

### Propuesta de Valor
> "De la inscripción al recap, sin fricción."

---

## 2. Usuarios Objetivo

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| Organizador / Admin | Crea eventos, gestiona inscritos, aprueba contenido | Dashboard completo |
| Staff / Operador | Check-in en puerta, registra incidencias | PWA móvil simplificada |
| Asistente / Fotógrafo | Se registra o sube fotos via enlace público | Sin cuenta requerida |

---

## 3. Funcionalidades Core — Los 4 Módulos

### Módulo 1: Motor de Difusión (Pre-Evento)

**Objetivo:** Automatizar la captación de inscritos y la estrategia de marketing.

**Funcionalidades:**
- **Data Ingestion Hub:** Webhooks bidireccionales con Google Forms, Typeform, Tally y Luma. Sincronización en tiempo real, deduplicación de correos y normalización de datos.
- **CRM de Asistentes:** Tabla con estado (Inscrito / Confirmado / Asistió), búsqueda, filtros y exportación CSV/JSON.
- **Generador de Copys (LLM):** A partir del título, temática, fecha y speakers del evento, genera:
  - 3 variaciones para LinkedIn (tono profesional)
  - 3 variaciones para Instagram (tono dinámico + emojis)
  - 2 variaciones para X / TikTok (tono corto y directo)
  - Cronograma de difusión sugerido: 15, 7 y 1 día antes del evento
- **Comunicaciones Automatizadas:** Recordatorios por correo o WhatsApp a la base de inscritos.

**Criterios de Aceptación:**
- Un inscrito desde Google Forms aparece en el CRM en menos de 5 segundos.
- El generador produce al menos 5 copys válidos en menos de 10 segundos.

---

### Módulo 2: Live Ops & Command Center (Durante el Evento)

**Objetivo:** Control táctico en tiempo real desde dispositivos móviles.

**Funcionalidades:**
- **Check-in Dinámico (PWA):**
  - Escaneo de QR o búsqueda manual por nombre/correo.
  - Marcado de asistencia en sub-segundos.
  - Cálculo en tiempo real del **Show-up Rate** (Asistentes reales / Inscritos × 100).
  - Funciona offline: almacena datos en caché y sincroniza al recuperar conexión.
- **Bitácora de Incidencias (Incident Logger):**
  - Formulario express: categoría (Logística, Aforo, Hardware, Software) + severidad (Baja, Media, Alta, Crítica) + descripción libre.
  - Historial persistente con timestamp, responsable y estado de resolución.
- **Dashboard de Aforo en Tiempo Real:**
  - Gráfico de capacidad vs. entradas validadas.
  - Alerta automática al alcanzar el 90% de ocupación.

**Criterios de Aceptación:**
- La interfaz de check-in carga en menos de 1.5 segundos en red móvil 4G.
- El registro de una incidencia toma menos de 15 segundos.

---

### Módulo 3: Vision AI Gallery (Post-Evento)

**Objetivo:** Curar automáticamente cientos de fotografías para seleccionar las mejores.

**Funcionalidades:**
- **Ingesta Masiva:**
  - Drag & drop para el equipo organizador.
  - Enlace/QR público para que asistentes y fotógrafos suban imágenes sin cuenta.
  - Compresión automática en el cliente (browser-side) antes de subir a Supabase Storage.
- **Pipeline de Visión Computacional (Gemini Vision API):**
  1. **Filtro de Descarte:** Detecta y descarta fotos borrosas, subexpuestas, sobreexpuestas o sin contenido relevante.
  2. **Clasificación Semántica:** Etiqueta automáticamente cada foto en: `Escenario`, `Público Atento`, `Ponente en Tarima`, `Networking`, `Patrocinadores/Branding`.
  3. **Scoring System:** Puntúa cada foto del 1 al 100 evaluando composición, iluminación y dinamismo.
  4. **Selección TOP 15:** Álbum preseleccionado automáticamente listo para publicación.

**Criterios de Aceptación:**
- El análisis de un lote de 10 fotos no supera los 8 segundos.
- Las fotos descartadas tienen un puntaje menor a 40.

---

### Módulo 4: AI Recap Engine & Analytics (Post-Evento)

**Objetivo:** Transformar datos brutos en entregables ejecutivos y de marketing.

**Funcionalidades:**
- **Generador de Recaps:** Combina temática del evento + asistencia real + incidencias + TOP fotos para generar:
  - Post de agradecimiento para LinkedIn e Instagram.
  - Nota de prensa / artículo para blog (Medium, Substack).
- **Dashboard de Analítica:**
  - Embudo de conversión: Vistas del formulario → Registros → Asistencias reales.
  - Show-up Rate histórico por evento.
  - Análisis de incidencias: categorías más frecuentes, tiempos de resolución.
  - Canal de registro más efectivo (Instagram, correo, referido).
- **Reporte Ejecutivo PDF:** Descargable con todas las métricas del evento.

---

## 4. Modelo de Negocio SaaS

| Característica | Community (Gratis) | Pro Organizer ($29–$49/mes) | Enterprise (Personalizado) |
|---|---|---|---|
| Eventos activos | 1 al mes | Ilimitados | Ilimitados |
| Asistentes por evento | Hasta 50 | Hasta 500 | Sin límite |
| Generación de copys | 5 por evento | Ilimitados + Planificador | Ilimitados + Marca propia |
| Webhooks | Manual (CSV) | Activos en tiempo real | API personalizada + Zapier/Make |
| Vision AI (fotos) | No incluido | Hasta 500 fotos/evento | Sin límite |
| Recap automático | No incluido | Incluido | Incluido |
| Reporte PDF | No incluido | Incluido | Incluido |
| Soporte | Comunidad | Email prioritario | Dedicado 24/7 + SLA |
| Seguridad | Básica | RLS + Backups | Corporativa + Auditoría |

---

## 5. Requerimientos No Funcionales

| ID | Requerimiento | Métrica |
|----|--------------|---------|
| RNF-01 | Rendimiento del check-in | Carga < 1.5s en 4G |
| RNF-02 | Procesamiento de fotos | Lote de 10 fotos < 8s |
| RNF-03 | Seguridad de datos | RLS en Supabase por organización |
| RNF-04 | Diseño Mobile-First | PWA operativa en pantallas desde 360px |
| RNF-05 | Disponibilidad | 99.9% uptime via Vercel Serverless |
| RNF-06 | Operación offline | Check-in funciona sin internet (sync posterior) |

---

## 6. Fuera de Alcance (MVP)

- Integración con Stripe / pagos de entradas.
- Multi-tenancy con sub-organizaciones.
- App nativa iOS/Android.
- Transmisión en vivo o streaming del evento.
