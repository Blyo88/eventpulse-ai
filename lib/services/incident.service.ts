import { createAdminClient } from '@/lib/supabase/admin'
import type { Tables } from '@/types/supabase'
import { z } from 'zod'

export const incidentSchema = z.object({
  event_id: z.string().uuid('Event ID debe ser UUID válido'),
  category: z.enum(['logistics', 'capacity', 'hardware', 'software', 'other']),
  description: z.string().min(10, 'Descripción mínimo 10 caracteres').max(1000),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
})

export type IncidentInput = z.infer<typeof incidentSchema>

class IncidentService {
  async getIncidentsByEventId(eventId: string): Promise<Tables<'incidents'>[]> {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Failed to fetch incidents: ${error.message}`)
    return data || []
  }

  async getIncidentById(id: string): Promise<Tables<'incidents'> | null> {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch incident: ${error.message}`)
    }
    return data || null
  }

  async createIncident(input: IncidentInput): Promise<Tables<'incidents'>> {
    const supabase = await createAdminClient()
    
    const { data, error } = await supabase
      .from('incidents')
      .insert([
        {
          event_id: input.event_id,
          category: input.category,
          description: input.description,
          severity: input.severity,
          resolved: false,
        },
      ])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create incident: ${error.message}`)
    }
    return data
  }

  async resolveIncident(id: string): Promise<Tables<'incidents'>> {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('incidents')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to resolve incident: ${error.message}`)
    }
    return data
  }

  async deleteIncident(id: string): Promise<void> {
    const supabase = await createAdminClient()
    const { error } = await supabase.from('incidents').delete().eq('id', id)

    if (error) {
      throw new Error(`Failed to delete incident: ${error.message}`)
    }
  }
}

export const incidentService = new IncidentService()
