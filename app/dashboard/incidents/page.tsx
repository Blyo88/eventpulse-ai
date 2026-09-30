import { incidentService } from '@/lib/services/incident.service'
import { eventService } from '@/lib/services/event.service'
import ReportIncidentModal from './report-modal'
import ResolveIncidentModal from './resolve-modal'
import type { Tables } from '@/types/supabase'

export const dynamic = 'force-dynamic'

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Baja', color: '#9b72cf', bgColor: 'rgba(155, 114, 207, 0.1)' },
  medium: { label: 'Media', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
  high: { label: 'Alta', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' },
  critical: { label: 'Crítica', color: '#dc2626', bgColor: 'rgba(220, 38, 38, 0.15)' },
}

const CATEGORY_CONFIG: Record<string, { label: string }> = {
  logistics: { label: 'Logística' },
  capacity: { label: 'Capacidad' },
  hardware: { label: 'Hardware' },
  software: { label: 'Software' },
  other: { label: 'Otro' },
}

function IncidentCard({ incident }: { incident: Tables<'incidents'> }) {
  const severity = SEVERITY_CONFIG[incident.severity] || SEVERITY_CONFIG.low
  const category = CATEGORY_CONFIG[incident.category] || CATEGORY_CONFIG.other
  const fecha = new Date(incident.created_at).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const hora = new Date(incident.created_at).toLocaleTimeString('es-ES', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <article 
      className="neu-card flex flex-col gap-3 transition-opacity duration-300"
      style={{ opacity: incident.resolved ? 0.75 : 1 }}
    >
      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="neu-badge" style={{ background: severity.bgColor, color: severity.color }}>
          {severity.label}
        </span>
        <span className="neu-badge" style={{ background: 'var(--surface-deep)', color: 'var(--text-muted)' }}>
          {category.label}
        </span>
        {incident.resolved ? (
          <span className="neu-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            ✓ Resuelto
          </span>
        ) : (
          <ResolveIncidentModal
            incidentId={incident.id}
            trigger={
              <button className="neu-badge cursor-pointer hover:opacity-80 transition-opacity" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', font: 'inherit' }}>
                Pendiente (Resolver)
              </button>
            }
          />
        )}
      </div>

      {/* Description */}
      <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
        {incident.description}
      </p>

      {/* Resolution Note */}
      {incident.resolved && incident.resolution_note && (
        <div 
          className="mt-2 p-3 rounded-xl"
          style={{ background: 'var(--surface-deep)', boxShadow: 'var(--shadow-soft-inset)' }}
        >
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
            Nota de solución:
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.4 }}>
            &quot;{incident.resolution_note}&quot;
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 mt-auto" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <path d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
        {fecha} · {hora}
      </div>
    </article>
  )
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
           style={{ boxShadow: 'var(--shadow-soft-inset)', background: 'var(--surface)' }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
             stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      </div>
      <h3 style={{ fontFamily: 'var(--font-nunito)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.125rem', marginBottom: 8 }}>
        Sin incidentes
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', maxWidth: 280 }}>
        No hay incidentes reportados en ningún evento. ¡Todo va bien!
      </p>
    </div>
  )
}

function EventSection({
  event,
  incidents,
}: {
  event: Tables<'events'>
  incidents: Tables<'incidents'>[]
}) {
  const openCount = incidents.filter((i) => !i.resolved).length
  const resolvedCount = incidents.filter((i) => i.resolved).length

  return (
    <section className="flex flex-col gap-4">
      {/* Event header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div
            className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full"
            style={{ boxShadow: 'var(--shadow-soft-raised)', background: 'var(--surface)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-nunito)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
              {event.title}
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {new Date(event.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              {event.location ? ` · ${event.location}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {openCount > 0 && (
            <span className="neu-badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              {openCount} abierto{openCount !== 1 ? 's' : ''}
            </span>
          )}
          {resolvedCount > 0 && (
            <span className="neu-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              {resolvedCount} resuelto{resolvedCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Incident cards grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {incidents.map((incident) => (
          <IncidentCard key={incident.id} incident={incident} />
        ))}
      </div>
    </section>
  )
}

export default async function IncidentsPage() {
  // Traer todos los eventos del usuario
  const events = await eventService.getEvents()
  const eventIds = events.map((e) => e.id)

  // Traer todos los incidentes de todos los eventos del usuario
  const allIncidents = await incidentService.getAllIncidents(eventIds)

  // Armar el mapa de incidentes { eventId -> incidents[] }
  const incidentsByEvent = new Map<string, Tables<'incidents'>[]>()
  for (const incident of allIncidents) {
    const list = incidentsByEvent.get(incident.event_id) || []
    list.push(incident)
    incidentsByEvent.set(incident.event_id, list)
  }

  // Eventos con incidentes primero, luego el resto
  const eventsWithIncidents = events.filter((e) => incidentsByEvent.has(e.id))
  const totalIncidents = allIncidents.length
  const totalOpen = allIncidents.filter((i) => !i.resolved).length

  return (
    <div className="flex flex-col gap-8 max-w-6xl">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 style={{ fontFamily: 'var(--font-nunito)', fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-primary)' }}>
            Incidentes en vivo
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 2 }}>
            {totalIncidents} incidente{totalIncidents !== 1 ? 's' : ''} en {eventsWithIncidents.length} evento{eventsWithIncidents.length !== 1 ? 's' : ''}
            {totalOpen > 0 && (
              <span style={{ color: '#ef4444', fontWeight: 600 }}>
                {' '}· {totalOpen} pendiente{totalOpen !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <ReportIncidentModal events={events} />
      </div>

      {/* Secciones agrupadas por evento */}
      {eventsWithIncidents.length === 0 ? (
        <EmptyState />
      ) : (
        eventsWithIncidents.map((event) => (
          <EventSection
            key={event.id}
            event={event}
            incidents={incidentsByEvent.get(event.id) || []}
          />
        ))
      )}
    </div>
  )
}
