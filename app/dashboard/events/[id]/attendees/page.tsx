import { eventService } from '@/lib/services/event.service'
import { attendeeService } from '@/lib/services/attendee.service'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AforoChart from '../aforo-chart'
import type { Tables } from '@/types/supabase'

export const dynamic = 'force-dynamic'

function AttendeeRow({ attendee }: { attendee: Tables<'attendees'> }) {
  const fecha = new Date(attendee.created_at).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div
      className="flex items-center justify-between gap-4 px-4 py-3 rounded-2xl"
      style={{
        background: 'var(--surface)',
        boxShadow: 'var(--shadow-soft-flat)',
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar inicial */}
        <div
          className="shrink-0 flex items-center justify-center rounded-full w-9 h-9"
          style={{
            background: 'var(--surface)',
            boxShadow: 'var(--shadow-soft-raised)',
            color: 'var(--accent)',
            fontFamily: 'var(--font-nunito)',
            fontWeight: 700,
            fontSize: '0.875rem',
          }}
        >
          {attendee.full_name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {attendee.full_name}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {attendee.email}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Vía registro */}
        <span className="neu-badge" style={{ display: 'none' /* mobile hide */ }}>
          {attendee.registered_via}
        </span>
        {/* Check-in badge */}
        <span
          className="neu-badge"
          style={{
            background: attendee.checked_in ? 'rgba(155,114,207,0.15)' : 'var(--surface-deep)',
            color: attendee.checked_in ? 'var(--accent)' : 'var(--text-muted)',
          }}
        >
          {attendee.checked_in ? '✓ Check-in' : 'Pendiente'}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{fecha}</span>
      </div>
    </div>
  )
}

export default async function AttendeesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [event, attendees] = await Promise.all([
    eventService.getEventById(id).catch(() => null),
    attendeeService.getAttendeesByEventId(id),
  ])

  if (!event) notFound()

  const checkedIn = attendees.filter((a) => a.checked_in).length
  const total = attendees.length
  const showUpRate = total > 0 ? Math.round((checkedIn / total) * 100) : 0

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
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
            <span className="neu-badge" style={{ color: '#9b72cf' }}>
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

      {/* Lista de asistentes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontFamily: 'var(--font-nunito)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
            Asistentes inscritos
          </h2>
          <span className="neu-badge">
            {total} total · {checkedIn} check-in
          </span>
        </div>

        {attendees.length === 0 ? (
          <div className="neu-card flex flex-col items-center py-14 gap-3">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                 stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Aún no hay asistentes inscritos.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Usa el webhook <code>POST /api/webhooks/forms</code> para registrar personas.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {attendees.map((attendee) => (
              <AttendeeRow key={attendee.id} attendee={attendee} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

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
