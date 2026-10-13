'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { inviteMemberSchema, InviteMemberInput } from '@/lib/validations/organization'
import { revalidatePath } from 'next/cache'

export async function inviteMemberAction({ 
  email, 
  role, 
  orgId 
}: InviteMemberInput & { orgId: string }) {
  // 1. Validar inputs
  const validated = inviteMemberSchema.safeParse({ email, role })
  if (!validated.success) return { success: false, message: 'Datos inválidos' }

  const supabase = createAdminClient()

  // 2. Obtener usuario ID vía RPC
  const { data: userId, error: rpcError } = await supabase
    .rpc('get_user_id_by_email', { p_email: email })

  if (rpcError || !userId) {
    return { success: false, message: 'Usuario no encontrado en la plataforma.' }
  }

  // 3. Insertar miembro
  const { error: insertError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: orgId,
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