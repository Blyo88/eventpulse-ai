import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/lib/services/ai.service'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const analyzeSchema = z.object({
  imageUrls: z.array(z.string().url('Debe ser una URL válida')).min(1, 'Se requiere al menos una foto'),
  eventName: z.string().optional(),
  eventDescription: z.string().optional(),
})

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

    const { imageUrls, eventName, eventDescription } = parsed.data
    
    // Llamar a Gemini Vision
    const aiResult = await aiService.analyzePhotosAndGenerateCopy(imageUrls, eventName, eventDescription)
    
    return NextResponse.json({ data: aiResult }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
