'use server'

import { createClient } from '@/lib/supabase/server'
import type { CreateEventInput } from '@/lib/validations'

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001'

export const eventService = {
  async createEvent(input: CreateEventInput) {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('events')
      .insert([{
        user_id: DEMO_USER_ID,
        title: input.title,
        description: input.description || null,
        date: input.date,
        location: input.location || null,
        capacity: input.capacity,
        status: 'draft',
      }])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create event: ${error.message}`)
    }

    return data
  },

  async getEvents() {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('events')
      .select('*')
      .eq('user_id', DEMO_USER_ID)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch events: ${error.message}`)
    }

    return data || []
  },

  async getEventById(eventId: string) {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
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

  async getEventStats(eventId: string) {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('attendees')
      .select('checked_in')
      .eq('event_id', eventId)

    if (error) {
      throw new Error(`Failed to fetch event stats: ${error.message}`)
    }

    const attendees = data || []
    const total = attendees.length
    const checkedIn = attendees.filter((a: any) => a.checked_in).length
    const showUpRate = total > 0 ? Math.round((checkedIn / total) * 100) : 0

    return { total, checkedIn, showUpRate }
  },

  async updateEventStatus(eventId: string, status: 'draft' | 'active' | 'finished' | 'archived') {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('events')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', eventId)
      .eq('user_id', DEMO_USER_ID)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update event: ${error.message}`)
    }

    return data
  },
}