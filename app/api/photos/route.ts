import { NextRequest, NextResponse } from 'next/server'
import { photoService } from '@/lib/services/photo.service'
import { eventService, GENERAL_STUDIO_EVENT_ID } from '@/lib/services/event.service'
import { getAuthUser, assertEventAccess, assertPhotoAccess, authErrorResponse } from '@/lib/auth/get-user'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { userId, organizationId } = await getAuthUser()

    const { searchParams } = new URL(request.url)
    const requestedEventId = searchParams.get('event_id')
    let eventId = requestedEventId

    if (requestedEventId === 'general' || requestedEventId === GENERAL_STUDIO_EVENT_ID) {
      if (!organizationId) return NextResponse.json({ data: [] }, { status: 200 })
      const generalEvent = await eventService.ensureGeneralStudioEvent(organizationId, userId)
      eventId = generalEvent.id
    }

    if (!eventId) {
      return NextResponse.json(
        { error: 'event_id query parameter requerido' },
        { status: 400 }
      )
    }

    if (!organizationId) {
      return NextResponse.json({ data: [] }, { status: 200 })
    }
    await assertEventAccess(eventId, organizationId)

    const photos = await photoService.getPhotosByEventId(eventId)
    return NextResponse.json({ data: photos }, { status: 200 })
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

    const formData = await request.formData()
    const eventId = formData.get('event_id')
    const file = formData.get('file')
    const category = formData.get('category')

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

    let targetEventId = eventId
    if (eventId !== 'general' && eventId !== GENERAL_STUDIO_EVENT_ID) {
      if (!organizationId) {
        return NextResponse.json({ error: 'No tienes una organización asignada' }, { status: 403 })
      }
      await assertEventAccess(eventId, organizationId)
    }
    if (eventId === 'general' || eventId === GENERAL_STUDIO_EVENT_ID) {
      if (!organizationId) {
        return NextResponse.json({ error: 'No tienes una organización asignada' }, { status: 403 })
      }
      const generalEvent = await eventService.ensureGeneralStudioEvent(organizationId, userId)
      targetEventId = generalEvent.id
    }

    const categoryStr = typeof category === 'string' ? category : undefined
    const photo = await photoService.uploadPhoto(targetEventId, file, categoryStr)
    return NextResponse.json({ data: photo }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    if (message === 'No autenticado') {
      return NextResponse.json({ error: message }, { status: 401 })
    }
    const status = message.includes('no permitido') || message.includes('excede') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { organizationId } = await getAuthUser()

    const body = await request.json()
    const ids = body.ids

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array de IDs (ids: string[])' },
        { status: 400 }
      )
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'No tienes una organización asignada' }, { status: 403 })
    }
    await assertPhotoAccess(ids, organizationId)
    await photoService.deletePhotos(ids)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    if (message === 'No autenticado') {
      return NextResponse.json({ error: message }, { status: 401 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { organizationId } = await getAuthUser()

    const body = await request.json()
    const { ids, category } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array de IDs (ids: string[])' },
        { status: 400 }
      )
    }

    if (!category || typeof category !== 'string') {
      return NextResponse.json(
        { error: 'Se requiere un campo category (string)' },
        { status: 400 }
      )
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'No tienes una organización asignada' }, { status: 403 })
    }
    await assertPhotoAccess(ids, organizationId)
    await photoService.updatePhotoCategories(ids, category)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    if (message === 'No autenticado') {
      return NextResponse.json({ error: message }, { status: 401 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
