import { eventService } from '@/lib/services/event.service'
import ScannerClient from './scanner-client'

export default async function LiveCheckInPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const event = await eventService.getEventById(eventId)

  if (!event || !event.enable_check_in) {
    return <div>Check-in no habilitado para este evento.</div>
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">{event.title} - Control de Puerta</h1>
      <ScannerClient eventId={eventId} enableHeatMap={event.enable_location_heat_map ?? false} />
    </div>
  )
}