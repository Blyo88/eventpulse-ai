'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { Tables } from '@/types/supabase'

export const organizationService = {
  async getOrganization(orgId: string): Promise<Tables<'organizations'> | null> {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single()

    if (error) return null
    return data
  },

  async inviteMember(orgId: string, email: string, role: 'admin' | 'editor' | 'spectator') {
    const supabase = createAdminClient()

    // 1. Buscar usuario por email en auth.users (la tabla pública no tiene auth emails)
    const { data: userData, error: userError } = await supabase
      .from('auth.users') // Nota: Esto usualmente requiere acceso a la tabla auth externa
      .select('id')
      .eq('email', email)
      .single()

    if (userError || !userData) {
      throw new Error('Usuario no encontrado en el sistema.')
    }

    // 2. Insertar
    const { error } = await supabase
      .from('organization_members')
      .insert({
        organization_id: orgId,
        user_id: userData.id,
        role: role
      })

    if (error) {
      if (error.code === '23505') throw new Error('El usuario ya es miembro.')
      throw new Error(`Error al invitar: ${error.message}`)
    }
  }
}