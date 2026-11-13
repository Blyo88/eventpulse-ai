'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthUser } from '@/lib/auth/get-user'
import { inviteMemberSchema, InviteMemberInput } from '@/lib/validations/organization'
import { revalidatePath } from 'next/cache'

export async function inviteMemberAction({ 
  email, 
  role, 
  orgId 
}: InviteMemberInput & { orgId: string }) {
  const validated = inviteMemberSchema.safeParse({ email, role })
  if (!validated.success) return { success: false, message: 'Datos inválidos' }

  // Never trust the orgId received from a client component.
  const { organizationId } = await getAuthUser()
  if (!organizationId || organizationId !== orgId) {
    return { success: false, message: 'No tienes permisos para gestionar este espacio.' }
  }

  const supabase = createAdminClient()

  const { data: userId, error: rpcError } = await (supabase as any)
    .rpc('get_user_id_by_email', { p_email: email })

  if (rpcError || !userId) {
    return { success: false, message: 'Usuario no encontrado en la plataforma.' }
  }

  const { error: insertError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: organizationId,
      user_id: userId,
      role: role
    })

  if (insertError) {
    if (insertError.code === '23505') return { success: false, message: 'El usuario ya pertenece a esta organización.' }
    return { success: false, message: 'Error al invitar al miembro.' }
  }

  revalidatePath('/dashboard/settings/workspace')
  return { success: true, message: `Invitación enviada a ${email}` }
}
