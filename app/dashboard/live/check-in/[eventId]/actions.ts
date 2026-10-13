'use server'

import { createAdminClient } from "@/lib/supabase/admin";
import { Tables } from "@/types/supabase";

export async function processQRCodeAction(accessToken: string, eventId: string) {
  const supabase = createAdminClient();

  // 1. Buscar asistente por token y evento
  const { data: attendee, error: fetchError } = await supabase
    .from('attendees')
    .select('id, full_name, checked_in')
    .eq('access_token', accessToken)
    .eq('event_id', eventId)
    .single();

  if (fetchError || !attendee) {
    return { success: false, message: 'Ticket inválido o no encontrado.' };
  }

  // 2. Prevenir doble check-in
  if (attendee.checked_in) {
    return { success: false, message: '¡Alerta! Este ticket ya ha sido utilizado.' };
  }

  // 3. Registrar asistencia
  const { error: updateError } = await supabase
    .from('attendees')
    .update({ 
      checked_in: true, 
      checked_in_at: new Date().toISOString() 
    })
    .eq('id', attendee.id);

  if (updateError) {
    return { success: false, message: 'Error interno al registrar.' };
  }

  return { success: true, message: `Acceso concedido: ${attendee.full_name}`, attendeeId: attendee.id };
}