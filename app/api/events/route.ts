import { NextRequest, NextResponse } from 'next/server'
import { createEventSchema } from '@/lib/validations'
import { eventService } from '@/lib/services/event.service'
import { ZodError } from 'zod'
import { createClient } from '@/lib/supabase/server'

// Organización compartida que usan todas las páginas del dashboard
// (ver supabase/migrations/0010_seed_demo_org.sql).
const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000000'

/**
 * Resuelve la organización y el usuario de la petición. Exige sesión iniciada.
 * Si no llega el header x-organization-id (caso del dashboard), usa la
 * organización demo, que es la misma desde la que se listan los eventos.
 */
async function resolveContext(request: NextRequest): Promise<{ organizationId: string; userId: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const organizationId = request.headers.get('x-organization-id') || DEMO_ORG_ID
  return { organizationId, userId: user.id }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const ctx = await resolveContext(request)

    if (!ctx) {
        return NextResponse.json({ success: false, error: 'Debes iniciar sesión' }, { status: 401 })
    }

    // Validate with Zod
    const validatedData = createEventSchema.parse(body)

    // Create event via service
    const event = await eventService.createEvent(validatedData, ctx.organizationId, ctx.userId)

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
    const ctx = await resolveContext(request)

    if (!ctx) {
        return NextResponse.json({ success: false, error: 'Debes iniciar sesión' }, { status: 401 })
    }

    const events = await eventService.getEvents(ctx.organizationId)

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
