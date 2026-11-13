import { NextRequest, NextResponse } from 'next/server'
import { incidentService, incidentSchema } from '@/lib/services/incident.service'
import { assertEventAccess, getAuthUser } from '@/lib/auth/get-user'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await getAuthUser()
    if (!organizationId) {
      return NextResponse.json({ data: [] }, { status: 200 })
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')

    if (!eventId) {
      return NextResponse.json(
        { error: 'event_id query parameter requerido' },
        { status: 400 }
      )
    }

    await assertEventAccess(eventId, organizationId)
    const incidents = await incidentService.getIncidentsByEventId(eventId)
    return NextResponse.json({ data: incidents }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    const status = message === 'No autenticado' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await getAuthUser()
    if (!organizationId) {
      return NextResponse.json({ error: 'No tienes una organización asignada' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = incidentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validación fallida', issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    await assertEventAccess(parsed.data.event_id, organizationId)
    const incident = await incidentService.createIncident(parsed.data)
    return NextResponse.json({ data: incident }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    const status = message === 'No autenticado' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
