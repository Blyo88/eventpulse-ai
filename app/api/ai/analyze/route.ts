import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/lib/services/ai.service'
import { eventService, GENERAL_STUDIO_EVENT_ID } from '@/lib/services/event.service'
import { getAuthUser, assertEventAccess } from '@/lib/auth/get-user'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const analyzeSchema = z.object({
  imageUrls: z.array(z.string().url('Debe ser una URL válida')).min(1, 'Se requiere al menos una foto'),
  eventName: z.string().optional(),
  eventDescription: z.string().optional(),
  eventId: z.string().optional(),
  requestedPhotoCount: z.number().int().min(1).max(10).default(3),
  customContext: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { userId, organizationId } = await getAuthUser()

    const searchParams = request.nextUrl.searchParams
    const rawEventId = searchParams.get('event_id')
    
    if (!rawEventId) {
      return NextResponse.json({ error: 'event_id es requerido' }, { status: 400 })
    }

    let eventId = rawEventId
    if (rawEventId === 'general' || rawEventId === GENERAL_STUDIO_EVENT_ID) {
      if (!organizationId) return NextResponse.json({ data: null }, { status: 200 })
      const generalEvent = await eventService.ensureGeneralStudioEvent(organizationId, userId)
      eventId = generalEvent.id
    }

    if (!eventId) return NextResponse.json({ data: null }, { status: 200 })
    if (!organizationId) return NextResponse.json({ data: null }, { status: 200 })
    await assertEventAccess(eventId, organizationId)

    const saved = await aiService.getAnalysisByEventId(eventId)
    if (!saved) {
      return NextResponse.json({ data: null }, { status: 200 })
    }

    const adaptedData = {
      selected_photos: saved.selected_photo_urls.map(url => ({
        url,
        ai_score: saved.ai_score,
        reason: ''
      })),
      generated_copy: saved.generated_copy
    }

    return NextResponse.json({ data: adaptedData }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    if (message === 'No autenticado') {
      return NextResponse.json({ error: message }, { status: 401 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, organizationId } = await getAuthUser()

    const body = await request.json()
    
    if (body.photo_urls && !body.imageUrls) {
      body.imageUrls = body.photo_urls;
    }
    
    const parsed = analyzeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validación fallida', issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { imageUrls, eventName, eventDescription, eventId: rawEventId, requestedPhotoCount, customContext } = parsed.data
    
    let eventId = (!rawEventId || rawEventId === 'general' || rawEventId === GENERAL_STUDIO_EVENT_ID)
      ? GENERAL_STUDIO_EVENT_ID
      : rawEventId

    if (eventId === GENERAL_STUDIO_EVENT_ID) {
      if (!organizationId) {
        return NextResponse.json({ error: 'No tienes una organización asignada' }, { status: 403 })
      }
      const generalEvent = await eventService.ensureGeneralStudioEvent(organizationId, userId)
      eventId = generalEvent.id
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'No tienes una organización asignada' }, { status: 403 })
    }
    await assertEventAccess(eventId, organizationId)

    const aiResult = await aiService.analyzePhotosAndGenerateCopy(
      imageUrls,
      eventName,
      eventDescription,
      requestedPhotoCount,
      customContext
    )
    
    await aiService.saveAnalysis(eventId, aiResult)

    return NextResponse.json({ data: aiResult }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    if (message === 'No autenticado') {
      return NextResponse.json({ error: message }, { status: 401 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
