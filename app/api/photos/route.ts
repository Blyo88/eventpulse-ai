import { NextRequest, NextResponse } from 'next/server'
import { photoService } from '@/lib/services/photo.service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')

    if (!eventId) {
      return NextResponse.json(
        { error: 'event_id query parameter requerido' },
        { status: 400 }
      )
    }

    const photos = await photoService.getPhotosByEventId(eventId)
    return NextResponse.json({ data: photos }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const eventId = formData.get('event_id')
    const file = formData.get('file')

    if (!eventId || typeof eventId !== 'string') {
      return NextResponse.json(
        { error: 'event_id es requerido' },
        { status: 400 }
      )
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Se requiere un archivo (campo "file")' },
        { status: 400 }
      )
    }

    const photo = await photoService.uploadPhoto(eventId, file)
    return NextResponse.json({ data: photo }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    const status = message.includes('no permitido') || message.includes('excede') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
