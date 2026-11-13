import { eventService, GENERAL_STUDIO_EVENT_ID } from '@/lib/services/event.service'
import { getAuthUser } from '@/lib/auth/get-user'
import AiStudioClient from './ai-studio-client'

export const dynamic = 'force-dynamic'

export default async function AiStudioPage() {
  const { organizationId } = await getAuthUser()

  const allEvents = organizationId
    ? await eventService.getEvents(organizationId)
    : []
  const events = allEvents.filter(
    (event) => event.id !== GENERAL_STUDIO_EVENT_ID && event.title !== 'Estudio Libre General'
  )

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <div>
        <h1 style={{ fontFamily: 'var(--font-nunito)', fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-primary)' }}>
          Estudio IA
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 2 }}>
          Sube fotos de tus eventos y déjale a la IA que cree contenido visual automáticamente
        </p>
      </div>

      <AiStudioClient events={events} />
    </div>
  )
}
