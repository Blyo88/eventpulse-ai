import { eventService } from '@/lib/services/event.service'
import { photoService } from '@/lib/services/photo.service'
import AiStudioClient from './ai-studio-client'
import type { Tables } from '@/types/supabase'

export const dynamic = 'force-dynamic'

export default async function AiStudioPage() {
  const events = await eventService.getEvents()

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      {/* Page header */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-nunito)', fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-primary)' }}>
          Estudio IA
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 2 }}>
          Sube fotos de tus eventos y déjale a la IA que cree contenido visual automáticamente
        </p>
      </div>

      {/* Studio */}
      <AiStudioClient events={events} />
    </div>
  )
}
