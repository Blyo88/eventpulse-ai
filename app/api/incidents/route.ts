import { NextRequest, NextResponse } from 'next/server'
import { incidentService, incidentSchema } from '@/lib/services/incident.service'

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

    const incidents = await incidentService.getIncidentsByEventId(eventId)
    return NextResponse.json({ data: incidents }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = incidentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validación fallida', issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const incident = await incidentService.createIncident(parsed.data)
    return NextResponse.json({ data: incident }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
