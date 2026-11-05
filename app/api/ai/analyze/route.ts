import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/lib/services/ai.service'
import { eventService, GENERAL_STUDIO_EVENT_ID } from '@/lib/services/event.service'
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
    const searchParams = request.nextUrl.searchParams
    const rawEventId = searchParams.get('event_id')
    
    if (!rawEventId) {
      return NextResponse.json({ error: 'event_id es requerido' }, { status: 400 })
    }

    const eventId = (rawEventId === 'general' || rawEventId === GENERAL_STUDIO_EVENT_ID)
      ? GENERAL_STUDIO_EVENT_ID
      : rawEventId

    const saved = await aiService.getAnalysisByEventId(eventId)
    if (!saved) {
      return NextResponse.json({ data: null }, { status: 200 })
    }

    // Adapt database record back to AiResult format for Tarea A frontend
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
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Si envían data.photo_urls (backward compat), mapearlo a imageUrls
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
    
    const eventId = (!rawEventId || rawEventId === 'general' || rawEventId === GENERAL_STUDIO_EVENT_ID)
      ? GENERAL_STUDIO_EVENT_ID
      : rawEventId

    if (eventId === GENERAL_STUDIO_EVENT_ID) {
      await eventService.ensureGeneralStudioEvent()
    }

    // Llamar a Gemini Vision
    const aiResult = await aiService.analyzePhotosAndGenerateCopy(
      imageUrls,
      eventName,
      eventDescription,
      requestedPhotoCount,
      customContext
    )
    
    // Guardar en la base de datos
    await aiService.saveAnalysis(eventId, aiResult)

    return NextResponse.json({ data: aiResult }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
