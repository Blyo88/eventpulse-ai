import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { CreateEventInput } from '@/lib/validations'
import type { Database, EventStatus, Tables, TablesInsert, TablesUpdate } from '@/types/supabase'

type EventRow = Tables<'events'>

/**
 * Identificador del usuario demo.
 *
 * Sustituye a `auth.getUser()` hasta que exista la fase de autenticación.
 */

export const eventService = {
  async createEvent(input: CreateEventInput, organizationId: string, userId: string): Promise<EventRow> {
    const supabase = createAdminClient()

    // Garantiza que la organización exista (la FK de events.organization_id lo exige)
    // y que el creador sea miembro de ella.
    const { error: orgError } = await supabase
      .from('organizations')
      .upsert({ id: organizationId, name: 'IEEE CIS Demo Cap' }, { onConflict: 'id', ignoreDuplicates: true })
    if (orgError) throw new Error(`Failed to ensure organization: ${orgError.message}`)

    await supabase
      .from('organization_members')
      .upsert(
        { organization_id: organizationId, user_id: userId, role: 'owner' },
        { onConflict: 'organization_id,user_id', ignoreDuplicates: true }
      )

    const eventData: TablesInsert<'events'> = {
      organization_id: organizationId,
      user_id: userId,
      title: input.title,
      description: input.description ?? null,
      date: input.date,
      location: input.location ?? null,
      capacity: input.capacity,
      status: 'draft',
      is_virtual: input.is_virtual,
      enable_check_in: input.enable_check_in,
      enable_location_heat_map: input.enable_location_heat_map,
    }

    const { data, error } = await supabase
      .from('events')
      .insert(eventData)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to create event: ${error.message}`)
    }

    return data
  },

  async getEvents(organizationId: string): Promise<EventRow[]> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch events: ${error.message}`)
    }

    return data
  },

  async getEventById(eventId: string, organizationId: string): Promise<EventRow> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('organization_id', organizationId)
      .single()

    if (error) {
      throw new Error(`Failed to fetch event: ${error.message}`)
    }

    return data
  },

  async updateEventStatus(eventId: string, status: EventStatus, organizationId: string): Promise<EventRow> {
    const supabase = createAdminClient()

    const patch: TablesUpdate<'events'> = { status }

    const { data, error } = await supabase
      .from('events')
      .update(patch)
      .eq('id', eventId)
      .eq('organization_id', organizationId)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to update event: ${error.message}`)
    }

    return data
  },

  async updateEvent(eventId: string, updates: TablesUpdate<'events'>, organizationId: string): Promise<EventRow> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .eq('organization_id', organizationId)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to update event: ${error.message}`)
    }

    return data
  },

  async deleteEvent(eventId: string, organizationId: string): Promise<void> {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('organization_id', organizationId)

    if (error) {
      throw new Error(`Failed to delete event: ${error.message}`)
    }
  },

}

/** Reexportado para los Route Handlers que necesiten el tipo de fila. */
export type { EventRow }
export type EventDatabase = Database
