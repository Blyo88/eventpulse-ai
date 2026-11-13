import { eventService } from '@/lib/services/event.service'
import { attendeeService } from '@/lib/services/attendee.service'
import { getAuthUser } from '@/lib/auth/get-user'
import ScannerClient from '../scanner-client'

export default async function LiveCheckInPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const { organizationId } = await getAuthUser()
  if (!organizationId) return <div>No tienes una organización configurada.</div>

  const [event, counts] = await Promise.all([
    eventService.getEventById(eventId, organizationId),
    attendeeService.getAttendeeCounts(eventId)
  ])

  if (!event || !event.enable_check_in) {
    return <div>Check-in no habilitado para este evento.</div>
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">{event.title} - Control de Puerta</h1>
      <ScannerClient 
        eventId={eventId} 
        enableHeatMap={event.enable_location_heat_map ?? false}
        initialPresent={counts.present}
        initialPending={counts.pending}
      />
    </div>
  )
}