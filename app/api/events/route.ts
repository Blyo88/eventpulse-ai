import { NextRequest, NextResponse } from 'next/server'
import { createEventSchema } from '@/lib/validations'
import { eventService } from '@/lib/services/event.service'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const organizationId = request.headers.get('x-organization-id')

    if (!organizationId) {
        return NextResponse.json({ success: false, error: 'Organization ID required' }, { status: 400 })
    }

    // Validate with Zod
    const validatedData = createEventSchema.parse(body)

    // Create event via service
    const event = await eventService.createEvent(validatedData, organizationId)

    return NextResponse.json(
      {
        success: true,
        data: event,
        message: 'Event created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof ZodError) {
      const errorDetails = error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }))
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: errorDetails,
        },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const organizationId = request.headers.get('x-organization-id')

    if (!organizationId) {
        return NextResponse.json({ success: false, error: 'Organization ID required' }, { status: 400 })
    }

    const events = await eventService.getEvents(organizationId)

    return NextResponse.json(
      {
        success: true,
        data: events,
        count: events.length,
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch events',
      },
      { status: 500 }
    )
  }
}
