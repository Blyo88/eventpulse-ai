import { NextRequest, NextResponse } from 'next/server'
import { createEventSchema } from '@/lib/validations'
import { eventService } from '@/lib/services/event.service'
import { getAuthUser } from '@/lib/auth/get-user'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const { userId, organizationId } = await getAuthUser()
    if (!organizationId) {
      return NextResponse.json({ error: 'No tienes una organización asignada' }, { status: 403 })
    }

    const body = await request.json()

    const validatedData = createEventSchema.parse({
      ...body,
      organization_id: organizationId,
    })

    const event = await eventService.createEvent(validatedData, organizationId, userId)

    return NextResponse.json(
      { success: true, data: event, message: 'Event created successfully' },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof ZodError) {
      const errorDetails = error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }))
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errorDetails },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      if (error.message === 'No autenticado') {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: false, error: 'Unknown error occurred' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await getAuthUser()
    if (!organizationId) {
      return NextResponse.json({ success: true, data: [], count: 0 }, { status: 200 })
    }

    const events = await eventService.getEvents(organizationId)

    return NextResponse.json(
      { success: true, data: events, count: events.length },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'No autenticado') {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: false, error: 'Failed to fetch events' }, { status: 500 })
  }
}
