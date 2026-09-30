import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/lib/services/ai.service'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const analyzeSchema = z.object({
  photo_urls: z.array(z.string().url('Debe ser una URL válida')).min(1, 'Se requiere al menos una foto'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const parsed = analyzeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validación fallida', issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { photo_urls } = parsed.data
    
    // Llamar a Gemini Vision
    const aiResult = await aiService.analyzePhotosAndGenerateCopy(photo_urls)
    
    return NextResponse.json({ data: aiResult }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
