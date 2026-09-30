import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { CheckInAttendeeInput, RegisterAttendeeInput } from '@/lib/validations'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/supabase'

type AttendeeRow = Tables<'attendees'>

export const attendeeService = {
  /**
   * Registra un asistente. `input` debe venir ya validado con Zod
   * (`registerAttendeeSchema`), esta capa no revalida.
   */
  async countAllAttendees(eventIds: string[]): Promise<number> {
    if (eventIds.length === 0) return 0
    const supabase = createAdminClient()
    const { count, error } = await supabase
      .from('attendees')
      .select('*', { count: 'exact', head: true })
      .in('event_id', eventIds)

    if (error) throw new Error(`Failed to count attendees: ${error.message}`)
    return count || 0
  },

  async registerAttendee(input: RegisterAttendeeInput): Promise<AttendeeRow> {
    const supabase = createAdminClient()

    const attendeeData: TablesInsert<'attendees'> = {
      event_id: input.event_id,
      full_name: input.full_name,
      email: input.email,
      registered_via: input.registered_via,
      checked_in: false,
    }

    const { data, error } = await supabase
      .from('attendees')
      .insert(attendeeData)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to register attendee: ${error.message}`)
    }

    return data
  },

  async getAttendeesByEventId(eventId: string): Promise<AttendeeRow[]> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('attendees')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch attendees: ${error.message}`)
    }

    return data
  },

  async checkInAttendee(input: CheckInAttendeeInput): Promise<AttendeeRow> {
    const supabase = createAdminClient()

    const patch: TablesUpdate<'attendees'> = {
      checked_in: true,
      checked_in_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('attendees')
      .update(patch)
      .eq('id', input.attendee_id)
      .eq('event_id', input.event_id)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to check in attendee: ${error.message}`)
    }

    return data
  },

  async getAttendeeById(attendeeId: string, eventId: string): Promise<AttendeeRow> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('attendees')
      .select('*')
      .eq('id', attendeeId)
      .eq('event_id', eventId)
      .single()

    if (error) {
      throw new Error(`Failed to fetch attendee: ${error.message}`)
    }

    return data
  },

  async getAttendeeByEmail(email: string, eventId: string): Promise<AttendeeRow | null> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('attendees')
      .select('*')
      .eq('email', email)
      .eq('event_id', eventId)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to fetch attendee by email: ${error.message}`)
    }

    return data
  },

  async updateAttendee(
    attendeeId: string,
    eventId: string,
    updates: TablesUpdate<'attendees'>,
  ): Promise<AttendeeRow> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('attendees')
      .update(updates)
      .eq('id', attendeeId)
      .eq('event_id', eventId)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to update attendee: ${error.message}`)
    }

    return data
  },

  async deleteAttendee(attendeeId: string, eventId: string): Promise<void> {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('attendees')
      .delete()
      .eq('id', attendeeId)
      .eq('event_id', eventId)

    if (error) {
      throw new Error(`Failed to delete attendee: ${error.message}`)
    }
  },
}

export type { AttendeeRow }
