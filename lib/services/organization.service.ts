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
    const { data: members, error } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: true })

    if (error) throw new Error(`Failed to fetch members: ${error.message}`)
    if (!members || members.length === 0) return []

    const userIds = members.map(m => m.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds)

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    return members.map(m => ({
      ...m,
      profile: profileMap.get(m.user_id) || { email: 'usuario@sistema.local', full_name: null }
    }))
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