export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          date: string
          location: string | null
          capacity: number
          status: 'draft' | 'active' | 'finished' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          date: string
          location?: string | null
          capacity?: number
          status?: 'draft' | 'active' | 'finished' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          date?: string
          location?: string | null
          capacity?: number
          status?: 'draft' | 'active' | 'finished' | 'archived'
          created_at?: string
          updated_at?: string
        }
      }
      attendees: {
        Row: {
          id: string
          event_id: string
          full_name: string
          email: string
          registered_via: string
          checked_in: boolean
          checked_in_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          full_name: string
          email: string
          registered_via?: string
          checked_in?: boolean
          checked_in_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          full_name?: string
          email?: string
          registered_via?: string
          checked_in?: boolean
          checked_in_at?: string | null
          created_at?: string
        }
      }
      incidents: {
        Row: {
          id: string
          event_id: string
          category: 'logistics' | 'capacity' | 'hardware' | 'software' | 'other'
          severity: 'low' | 'medium' | 'high' | 'critical'
          description: string
          resolved: boolean
          resolved_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          category: 'logistics' | 'capacity' | 'hardware' | 'software' | 'other'
          severity: 'low' | 'medium' | 'high' | 'critical'
          description: string
          resolved?: boolean
          resolved_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          category?: 'logistics' | 'capacity' | 'hardware' | 'software' | 'other'
          severity?: 'low' | 'medium' | 'high' | 'critical'
          description?: string
          resolved?: boolean
          resolved_at?: string | null
          created_at?: string
        }
      }
      photos: {
        Row: {
          id: string
          event_id: string
          storage_url: string
          ai_score: number | null
          category: 'stage' | 'audience' | 'networking' | 'branding' | 'other' | null
          is_selected: boolean
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          storage_url: string
          ai_score?: number | null
          category?: 'stage' | 'audience' | 'networking' | 'branding' | 'other' | null
          is_selected?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          storage_url?: string
          ai_score?: number | null
          category?: 'stage' | 'audience' | 'networking' | 'branding' | 'other' | null
          is_selected?: boolean
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
