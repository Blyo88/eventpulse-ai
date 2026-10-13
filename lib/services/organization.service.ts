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
      .select('*, user_id') // TODO: Involucrar auth.users cuando sea necesario
      .eq('organization_id', orgId)
      .order('created_at', { ascending: true })

    if (error) throw new Error(`Failed to fetch members: ${error.message}`)
    return data
  }
}