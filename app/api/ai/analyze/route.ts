import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/lib/services/ai.service'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const analyzeSchema = z.object({
  imageUrls: z.array(z.string().url('Debe ser una URL válida')).min(1, 'Se requiere al menos una foto'),
  eventName: z.string().optional(),
  eventDescription: z.string().optional(),
  eventId: z.string().uuid('Event ID inválido'),
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const eventId = searchParams.get('event_id')
    
    if (!eventId) {
      return NextResponse.json({ error: 'event_id es requerido' }, { status: 400 })
    }

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

    const { imageUrls, eventName, eventDescription, eventId } = parsed.data
    
    // Llamar a Gemini Vision
    const aiResult = await aiService.analyzePhotosAndGenerateCopy(imageUrls, eventName, eventDescription)
    
    // Guardar en la base de datos
    await aiService.saveAnalysis(eventId, aiResult)

    return NextResponse.json({ data: aiResult }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
