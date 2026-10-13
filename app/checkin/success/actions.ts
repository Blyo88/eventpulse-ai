'use server'

import { createAdminClient } from "@/lib/supabase/admin";

export async function updateAttendeeLocationAction(attendeeId: string, lat: number, lng: number) {
  const supabase = createAdminClient();
  
  const { error } = await supabase
    .from('attendees')
    .update({ latitude: lat, longitude: lng })
    .eq('id', attendeeId);

  if (error) {
    console.error('Error guardando locación anonimizada:', error);
    // No lanzamos error para no romper la UI, es un dato opcional
  }
}