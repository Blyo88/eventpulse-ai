import { eventService } from '@/lib/services/event.service'
import type { Tables } from '@/types/supabase'
import CreateEventModal from './create-event-modal'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, string> = {
  draft:    'Borrador',
  active:   'Activo',
  finished: 'Finalizado',
  archived: 'Archivado',
}

const STATUS_COLORS: Record<string, string> = {
  draft:    '#a0aec0',
  active:   '#9b72cf',
  finished: '#718096',
  archived: '#a0aec0',
}

function EventCard({ event }: { event: Tables<'events'> }) {
  const fecha = new Date(event.date).toLocaleDateString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
  const hora = new Date(event.date).toLocaleTimeString('es-ES', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <Link href={`/dashboard/events/${event.id}`} className="block">
      <article className="neu-card h-full flex flex-col gap-3 cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 style={{
            fontFamily: 'var(--font-nunito)',
            fontWeight: 700,
            fontSize: '1rem',
            color: 'var(--text-primary)',
            lineHeight: 1.3,
            flex: 1,
          }}>
            {event.title}
          </h3>
          <span className="neu-badge shrink-0" style={{ color: STATUS_COLORS[event.status] }}>
            {STATUS_LABELS[event.status] ?? event.status}
          </span>
        </div>

        {/* Description */}
        {event.description && (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {event.description}
          </p>
        )}

        {/* Meta */}
        <div className="flex flex-col gap-1.5 mt-auto">
          <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            {fecha} · {hora}
          </div>

          {event.location && (
            <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {event.location}
            </div>
          )}

          {event.capacity > 0 && (
            <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Aforo: {event.capacity}
            </div>
          )}
        </div>

        {/* CTA hint */}
        <div className="flex items-center gap-1 mt-1"
             style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 700 }}>
          <span>Ver asistentes</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </article>
    </Link>
  )
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
           style={{ boxShadow: 'var(--shadow-soft-inset)', background: 'var(--surface)' }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
             stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
        </svg>
      </div>
      <h3 style={{ fontFamily: 'var(--font-nunito)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.125rem', marginBottom: 8 }}>
        Sin eventos aún
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', maxWidth: 280 }}>
        Crea tu primer evento usando el botón superior y empieza a gestionar tus asistentes.
      </p>
    </div>
  )
}

export default async function EventsPage() {
  const events = await eventService.getEvents()

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 style={{ fontFamily: 'var(--font-nunito)', fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-primary)' }}>
            Mis eventos
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 2 }}>
            {events.length} evento{events.length !== 1 ? 's' : ''} registrado{events.length !== 1 ? 's' : ''}
          </p>
        </div>
        <CreateEventModal />
      </div>

      {/* Grid */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {events.length === 0 ? (
          <EmptyState />
        ) : (
          events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))
        )}
      </div>
    </div>
  )
}
