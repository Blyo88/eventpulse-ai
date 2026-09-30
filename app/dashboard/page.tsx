import { eventService } from '@/lib/services/event.service'
import { incidentService } from '@/lib/services/incident.service'
import { attendeeService } from '@/lib/services/attendee.service'
import Link from 'next/link'
import * as motion from 'framer-motion/client'

export const dynamic = 'force-dynamic'

export default async function DashboardIndex() {
  const events = await eventService.getEvents()
  
  const eventIds = events.map(e => e.id)
  
  const [incidents, totalAttendees] = await Promise.all([
    incidentService.getAllIncidents(eventIds),
    attendeeService.countAllAttendees(eventIds),
  ])

  const openIncidents = incidents.filter(i => !i.resolved).length

  return (
    <div className="flex flex-col gap-8 max-w-6xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <h1 style={{ fontFamily: 'var(--font-nunito)', fontWeight: 800, fontSize: '1.8rem', color: 'var(--text-primary)' }}>
          ¡Bienvenido de nuevo a EventPulse AI!
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
          Aquí tienes un resumen rápido de cómo van todas tus cosas.
        </p>
      </motion.div>

      {/* Grid de métricas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Total Eventos */}
        <div className="neu-card flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-soft-inset)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <p style={{ fontFamily: 'var(--font-nunito)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Mis Eventos
            </p>
          </div>
          <p style={{ fontFamily: 'var(--font-nunito)', fontWeight: 800, fontSize: '2.5rem', color: 'var(--text-primary)', lineHeight: 1 }}>
            {events.length}
          </p>
        </div>

        {/* Total Asistentes */}
        <div className="neu-card flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-soft-inset)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p style={{ fontFamily: 'var(--font-nunito)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Asistentes
            </p>
          </div>
          <p style={{ fontFamily: 'var(--font-nunito)', fontWeight: 800, fontSize: '2.5rem', color: 'var(--text-primary)', lineHeight: 1 }}>
            {totalAttendees}
          </p>
        </div>

        {/* Incidentes Abiertos */}
        <div className="neu-card flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-soft-inset)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={openIncidents > 0 ? '#ef4444' : '#10b981'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <path d="M12 9v4M12 17h.01" />
              </svg>
            </div>
            <p style={{ fontFamily: 'var(--font-nunito)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Incidentes Críticos/Abiertos
            </p>
          </div>
          <p style={{ fontFamily: 'var(--font-nunito)', fontWeight: 800, fontSize: '2.5rem', color: openIncidents > 0 ? '#ef4444' : '#10b981', lineHeight: 1 }}>
            {openIncidents}
          </p>
        </div>
      </motion.div>

      {/* Botón de acceso rápido */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex mt-4"
      >
        <Link href="/dashboard/events" style={{ textDecoration: 'none' }}>
          <button className="neu-btn-primary" style={{ padding: '14px 32px', fontSize: '1rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            Ir a mis eventos
          </button>
        </Link>
      </motion.div>
    </div>
  )
}
