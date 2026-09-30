import { NextRequest, NextResponse } from 'next/server'
import { attendeeService } from '@/lib/services/attendee.service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event_id, full_name, email, registered_via } = body

    if (!event_id || !full_name || !email) {
      return NextResponse.json(
        { error: 'event_id, full_name y email son requeridos' },
        { status: 400 }
      )
    }

    const attendee = await attendeeService.registerAttendee({
      event_id,
      full_name,
      email,
      registered_via: registered_via || 'manual',
    })

    return NextResponse.json({ data: attendee }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    const status = message.includes('duplicate') || message.includes('unique') ? 409 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
