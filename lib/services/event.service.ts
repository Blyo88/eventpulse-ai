import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { CreateEventInput } from '@/lib/validations'
import type { Database, EventStatus, Tables, TablesInsert, TablesUpdate } from '@/types/supabase'

type EventRow = Tables<'events'>

/**
 * Identificador del usuario demo.
 *
 * Sustituye a `auth.getUser()` hasta que exista la fase de autenticación.
 * `events.user_id` referencia `auth.users(id)`, así que este UUID debe
 * existir en `auth.users` o el INSERT viola la FK. Lo crea
 * `scripts/seed-demo-user.mjs`.
 */
export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001'

export const eventService = {
  async createEvent(input: CreateEventInput): Promise<EventRow> {
    const supabase = createAdminClient()

    const eventData: TablesInsert<'events'> = {
      user_id: DEMO_USER_ID,
      title: input.title,
      description: input.description ?? null,
      date: input.date,
      location: input.location ?? null,
      capacity: input.capacity,
      status: 'draft',
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

  async getEvents(): Promise<EventRow[]> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', DEMO_USER_ID)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch events: ${error.message}`)
    }

    return data
  },

  async getEventById(eventId: string): Promise<EventRow> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('user_id', DEMO_USER_ID)
      .single()

    if (error) {
      throw new Error(`Failed to fetch event: ${error.message}`)
    }

    return data
  },

  async getEventStats(eventId: string): Promise<{ total: number; checkedIn: number; showUpRate: number }> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('attendees')
      .select('checked_in')
      .eq('event_id', eventId)

    if (error) {
      throw new Error(`Failed to fetch event stats: ${error.message}`)
    }

    const total = data.length
    const checkedIn = data.reduce((acc, attendee) => acc + (attendee.checked_in ? 1 : 0), 0)
    const showUpRate = total > 0 ? Math.round((checkedIn / total) * 100) : 0

    return { total, checkedIn, showUpRate }
  },

  async updateEventStatus(eventId: string, status: EventStatus): Promise<EventRow> {
    const supabase = createAdminClient()

    const patch: TablesUpdate<'events'> = { status }

    const { data, error } = await supabase
      .from('events')
      .update(patch)
      .eq('id', eventId)
      .eq('user_id', DEMO_USER_ID)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to update event: ${error.message}`)
    }

    return data
  },

  async updateEvent(eventId: string, updates: TablesUpdate<'events'>): Promise<EventRow> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .eq('user_id', DEMO_USER_ID)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to update event: ${error.message}`)
    }

    return data
  },

  async deleteEvent(eventId: string): Promise<void> {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', DEMO_USER_ID)

    if (error) {
      throw new Error(`Failed to delete event: ${error.message}`)
    }
  },
}

/** Reexportado para los Route Handlers que necesiten el tipo de fila. */
export type { EventRow }
export type EventDatabase = Database
