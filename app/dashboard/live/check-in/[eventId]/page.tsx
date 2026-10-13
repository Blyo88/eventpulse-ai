import { eventService } from '@/lib/services/event.service'
import { attendeeService } from '@/lib/services/attendee.service'
import ScannerClient from '../scanner-client'

const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000000'

export default async function LiveCheckInPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const [event, counts] = await Promise.all([
    eventService.getEventById(eventId, DEMO_ORG_ID),
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