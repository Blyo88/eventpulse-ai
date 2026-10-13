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

  async getMembers(orgId: string) {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('organization_members')
      .select('*, user_id')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: true })

    if (error) throw new Error(`Failed to fetch members: ${error.message}`)
    return data || []
  },

  async inviteMember(orgId: string, email: string, role: 'admin' | 'editor' | 'spectator') {
    const supabase = createAdminClient()

    // 1. Buscar usuario por email usando RPC
    const { data: userId, error: rpcError } = await (supabase as any)
      .rpc('get_user_id_by_email', { p_email: email })

    if (rpcError || !userId) {
      throw new Error('Usuario no encontrado en el sistema.')
    }

    // 2. Insertar
    const { error } = await supabase
      .from('organization_members')
      .insert({
        organization_id: orgId,
        user_id: userId,
        role: role
      })

    if (error) {
      if (error.code === '23505') throw new Error('El usuario ya es miembro.')
      throw new Error(`Error al invitar: ${error.message}`)
    }
  }
}