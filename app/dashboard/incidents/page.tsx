import { incidentService } from '@/lib/services/incident.service'
import { eventService } from '@/lib/services/event.service'
import { getAuthUser } from '@/lib/auth/get-user'
import ReportIncidentModal from './report-modal'
import IncidentsTableClient from './IncidentsTableClient'

export const dynamic = 'force-dynamic'

export default async function IncidentsPage() {
  const { organizationId } = await getAuthUser()

  const events = organizationId
    ? await eventService.getEvents(organizationId)
    : []
  const eventIds = events.map((e) => e.id)

  const allIncidents = await incidentService.getAllIncidents(eventIds)
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
            {totalIncidents} incidente{totalIncidents !== 1 ? 's' : ''} en total
            {totalOpen > 0 && (
              <span style={{ color: '#ef4444', fontWeight: 600 }}>
                {' '}· {totalOpen} pendiente{totalOpen !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <ReportIncidentModal events={events} />
      </div>

      {/* Tabla Cronológica con filtro por Evento y Estado */}
      <IncidentsTableClient events={events} incidents={allIncidents} />
    </div>
  )
}
