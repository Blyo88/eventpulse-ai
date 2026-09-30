import { incidentService } from '@/lib/services/incident.service'
import ReportIncidentModal from './report-modal'
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
    <article className="neu-card flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <span className="neu-badge" style={{ background: severity.bgColor, color: severity.color }}>
          {severity.label}
        </span>
        <span className="neu-badge" style={{ background: 'var(--surface-deep)', color: 'var(--text-muted)' }}>
          {category.label}
        </span>
      </div>

      {/* Description */}
      <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
        {incident.description}
      </p>

      {/* Status */}
      <div className="flex items-center gap-2">
        {incident.resolved ? (
          <span className="neu-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            ✓ Resuelto
          </span>
        ) : (
          <span className="neu-badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            Pendiente
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 mt-2" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
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
        Espera que ocurra algo y podrás reportar incidentes aquí. ¡Esperamos que todo vaya bien!
      </p>
    </div>
  )
}

export default async function IncidentsPage() {
  // Por ahora pasamos un ID de evento demo — en producción vendría de un selector
  const incidents = await incidentService.getIncidentsByEventId('demo-event-id').catch(() => [])

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 style={{ fontFamily: 'var(--font-nunito)', fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-primary)' }}>
            Incidentes en vivo
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 2 }}>
            {incidents.length} incidente{incidents.length !== 1 ? 's' : ''} registrado{incidents.length !== 1 ? 's' : ''}
          </p>
        </div>
        <ReportIncidentModal eventId="demo-event-id" />
      </div>

      {/* Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {incidents.length === 0 ? (
          <EmptyState />
        ) : (
          incidents.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} />
          ))
        )}
      </div>
    </div>
  )
}
