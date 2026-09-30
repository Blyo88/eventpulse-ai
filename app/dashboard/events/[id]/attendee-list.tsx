'use client'

import type { Tables } from '@/types/supabase'

export default function AttendeeList({ attendees }: { attendees: Tables<'attendees'>[] }) {
  if (attendees.length === 0) {
    return (
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
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {attendees.map((attendee) => {
        const fecha = new Date(attendee.created_at).toLocaleDateString('es-ES', {
          day: 'numeric', month: 'short', year: 'numeric',
        })
        return (
          <div
            key={attendee.id}
            className="flex items-center justify-between gap-4 px-4 py-3 rounded-2xl"
            style={{
              background: 'var(--surface)',
              boxShadow: 'var(--shadow-soft-flat)',
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
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
      })}
    </div>
  )
}
