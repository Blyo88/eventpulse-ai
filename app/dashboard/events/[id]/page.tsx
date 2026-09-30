import { eventService } from '@/lib/services/event.service'
import { attendeeService } from '@/lib/services/attendee.service'
import { incidentService } from '@/lib/services/incident.service'
import { photoService } from '@/lib/services/photo.service'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AforoChart from './aforo-chart'
import EventTabs from './event-tabs'
import type { Tables } from '@/types/supabase'

export const dynamic = 'force-dynamic'

function StatBox({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div
      className="flex flex-col gap-1 p-3 rounded-xl"
      style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-soft-inset)' }}
    >
      <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
        {icon}
        <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {label}
        </span>
      </div>
      <p style={{
        fontFamily: 'var(--font-nunito)',
        fontWeight: 700,
        fontSize: '0.95rem',
        color: accent ? 'var(--accent)' : 'var(--text-primary)',
      }}>
        {value}
      </p>
    </div>
  )
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [event, attendees, incidents, photos] = await Promise.all([
    eventService.getEventById(id).catch(() => null),
    attendeeService.getAttendeesByEventId(id),
    incidentService.getIncidentsByEventId(id),
    photoService.getPhotosByEventId(id),
  ])

  if (!event) notFound()

  const checkedIn = attendees.filter((a) => a.checked_in).length
  const total = attendees.length
  const showUpRate = total > 0 ? Math.round((checkedIn / total) * 100) : 0
  const openIncidents = incidents.filter((i) => !i.resolved).length

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <Link href="/dashboard/events"
              style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
          Eventos
        </Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6"/>
        </svg>
        <span>{event.title}</span>
      </div>

      {/* Panel superior: info + gráfico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Info evento */}
        <div className="neu-card lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 style={{ fontFamily: 'var(--font-nunito)', fontWeight: 800, fontSize: '1.4rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {event.title}
              </h1>
              {event.description && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 6 }}>
                  {event.description}
                </p>
              )}
            </div>
            <span className="neu-badge" style={{ color: 'var(--accent)' }}>
              {event.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatBox
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>}
              label="Fecha"
              value={new Date(event.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            />
            {event.location && (
              <StatBox
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>}
                label="Ubicación"
                value={event.location}
              />
            )}
            <StatBox
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
              label="Inscritos"
              value={`${total} ${event.capacity > 0 ? `/ ${event.capacity}` : ''}`}
            />
            <StatBox
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>}
              label="Show-up rate"
              value={`${showUpRate}%`}
              accent={showUpRate >= 70}
            />
          </div>

          {/* Progress bar */}
          {event.capacity > 0 && (
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                Ocupación del aforo
              </p>
              <div className="neu-progress">
                <div
                  className="neu-progress-fill"
                  style={{ width: `${Math.min(100, Math.round((total / event.capacity) * 100))}%` }}
                />
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {Math.round((total / event.capacity) * 100)}% ocupado
              </p>
            </div>
          )}
        </div>

        {/* Gráfico Recharts */}
        <div className="neu-card flex flex-col justify-center items-center">
          <p style={{ fontFamily: 'var(--font-nunito)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: 8, textAlign: 'center' }}>
            Estado de asistencia
          </p>
          <AforoChart total={total} checkedIn={checkedIn} capacity={event.capacity} />
        </div>
      </div>

      {/* Tabs: Asistentes / Incidentes / Galería */}
      <EventTabs
        eventId={event.id}
        attendees={attendees}
        incidents={incidents}
        photos={photos}
        openIncidents={openIncidents}
      />
    </div>
  )
}
