import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token requerido' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // 1. Validar token y buscar asistente
  const { data: attendee, error } = await supabase
    .from('attendees')
    .select('id, event_id, events(is_virtual, enable_check_in)')
    .eq('access_token', token)
    .single()

  if (error || !attendee) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 404 })
  }

  // 2. Verificar si el evento permite check-in
  const event = attendee.events as any
  if (!event.enable_check_in) {
    return NextResponse.json({ error: 'Check-in no habilitado para este evento' }, { status: 403 })
  }

  // 3. Marcar como Checked In
  const { error: updateError } = await supabase
    .from('attendees')
    .update({ 
      checked_in: true,
      checked_in_at: new Date().toISOString()
    })
    .eq('id', attendee.id)

  if (updateError) {
    return NextResponse.json({ error: 'Error al procesar check-in' }, { status: 500 })
  }

  // 4. Redirigir a éxito con IDs para heatmap si aplica
  const redirectUrl = new URL('/checkin/success', request.url)
  redirectUrl.searchParams.set('attendeeId', attendee.id)
  if (event.enable_location_heat_map) {
    redirectUrl.searchParams.set('heatmap', 'true')
  }

  return NextResponse.redirect(redirectUrl)
}