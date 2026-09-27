'use server'

import { createClient } from '@/lib/supabase/server'
import type { RegisterAttendeeInput, CheckInAttendeeInput } from '@/lib/validations'

export const attendeeService = {
  async registerAttendee(input: RegisterAttendeeInput) {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('attendees')
      .insert([{
        event_id: input.event_id,
        full_name: input.full_name,
        email: input.email,
        registered_via: input.registered_via,
        checked_in: false,
      }])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to register attendee: ${error.message}`)
    }

    return data
  },

  async getAttendeesByEventId(eventId: string) {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('attendees')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch attendees: ${error.message}`)
    }

    return data || []
  },

  async checkInAttendee(input: CheckInAttendeeInput) {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('attendees')
      .update({
        checked_in: true,
        checked_in_at: new Date().toISOString(),
      })
      .eq('id', input.attendee_id)
      .eq('event_id', input.event_id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to check in attendee: ${error.message}`)
    }

    return data
  },

  async getAttendeeByEmail(email: string, eventId: string) {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('attendees')
      .select('*')
      .eq('email', email)
      .eq('event_id', eventId)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to fetch attendee by email: ${error.message}`)
    }

    return data || null
  },

  async updateAttendee(attendeeId: string, eventId: string, updates: any) {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('attendees')
      .update(updates)
      .eq('id', attendeeId)
      .eq('event_id', eventId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update attendee: ${error.message}`)
    }

    return data
  },

  async deleteAttendee(attendeeId: string, eventId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await (supabase as any)
      .from('attendees')
      .delete()
      .eq('id', attendeeId)
      .eq('event_id', eventId)

    if (error) {
      throw new Error(`Failed to delete attendee: ${error.message}`)
    }
  },
}