import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { CreateEventInput } from '@/lib/validations'
import type { Database, EventStatus, Tables, TablesInsert, TablesUpdate } from '@/types/supabase'

type EventRow = Tables<'events'>

export const GENERAL_STUDIO_EVENT_ID = '00000000-0000-0000-0000-000000000001'

export const eventService = {
  async ensureGeneralStudioEvent(organizationId: string, userId: string): Promise<EventRow> {
    const supabase = createAdminClient()

    // El estudio libre es uno por organización, no uno global para todos los usuarios.
    const { data: existing } = await supabase
      .from('events')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('title', 'Estudio Libre General')
      .maybeSingle()

    if (existing) return existing

    const { data, error } = await supabase
      .from('events')
      .insert({
        user_id: userId,
        organization_id: organizationId,
        title: 'Estudio Libre General',
        description: 'Espacio de creación y análisis independiente con IA',
        date: new Date().toISOString(),
        status: 'active',
        capacity: 0,
        is_virtual: true,
        enable_check_in: false,
        enable_location_heat_map: false,
      } as any)
      .select('*')
      .single()

    if (error) {
      const { data: retry } = await supabase
        .from('events')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('title', 'Estudio Libre General')
        .maybeSingle()
      if (retry) return retry
      throw new Error(`Failed to ensure general studio event: ${error.message}`)
    }

    return data
  },

  async createEvent(input: CreateEventInput, organizationId: string, userId: string): Promise<EventRow> {
    const supabase = createAdminClient()

    const eventData = {
      user_id: userId,
      organization_id: organizationId,
      title: input.title,
      description: input.description ?? null,
      date: input.date,
      location: input.location ?? null,
      capacity: input.capacity,
      status: 'draft',
      is_virtual: input.is_virtual,
      enable_check_in: input.enable_check_in,
      enable_location_heat_map: input.enable_location_heat_map,
    } as any

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

  /** Get event by ID without org check (for attendee registration via webhook) */
  async getEventByIdUnsafe(eventId: string): Promise<EventRow> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
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
