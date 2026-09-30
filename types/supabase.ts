/**
 * Tipos de base de datos generados a mano para EventPulse AI.
 *
 * Estos tipos DEBEN cumplir el contrato `GenericSchema` de `@supabase/postgrest-js`:
 *
 *   type GenericTable = {
 *     Row: Record<string, unknown>
 *     Insert: Record<string, unknown>
 *     Update: Record<string, unknown>
 *     Relationships: GenericRelationship[]   <- obligatorio
 *   }
 *
 * Si falta `Relationships` en cualquier tabla, `Database` deja de satisfacer
 * `GenericSchema`, la inferencia condicional colapsa a `never` y TODAS las
 * consultas `.from(...).insert(...)` fallan con "argument of type 'never'".
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/** Copia local de `GenericRelationship` (no exportado por postgrest-js). */
export type Relationship = {
  foreignKeyName: string
  columns: string[]
  isOneToOne: boolean
  referencedRelation: string
  referencedColumns: string[]
}

export type EventStatus = 'draft' | 'active' | 'finished' | 'archived'
export type IncidentCategory = 'logistics' | 'capacity' | 'hardware' | 'software' | 'other'
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical'
export type PhotoCategory = 'stage' | 'audience' | 'networking' | 'branding' | 'other'

/**
 * Las tablas hijas declaran su FK `*_event_id_fkey` hacia `events`.
 * `events` no declara ninguna: su única FK apunta a `auth.users`, fuera de `public`.
 */

export type Database = {
  public: {
    Tables: {
      ai_analyses: {
        Row: {
          id: string
          event_id: string
          selected_photo_urls: string[]
          generated_copy: string
          ai_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          selected_photo_urls?: string[]
          generated_copy: string
          ai_score: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          selected_photo_urls?: string[]
          generated_copy?: string
          ai_score?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_analyses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          }
        ]
      }
      events: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          date: string
          location: string | null
          capacity: number
          status: EventStatus
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
          status?: EventStatus
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
          status?: EventStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: 'attendees_event_id_fkey',
            columns: ['event_id'],
            isOneToOne: false,
            referencedRelation: 'events',
            referencedColumns: ['id'],
          },
        ]
      }
      incidents: {
        Row: {
          id: string
          event_id: string
          category: IncidentCategory
          severity: IncidentSeverity
          description: string
          resolved: boolean
          resolved_at: string | null
          resolution_note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          category: IncidentCategory
          severity: IncidentSeverity
          description: string
          resolved?: boolean
          resolved_at?: string | null
          resolution_note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          category?: IncidentCategory
          severity?: IncidentSeverity
          description?: string
          resolved?: boolean
          resolved_at?: string | null
          resolution_note?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'incidents_event_id_fkey',
            columns: ['event_id'],
            isOneToOne: false,
            referencedRelation: 'events',
            referencedColumns: ['id'],
          },
        ]
      }
      photos: {
        Row: {
          id: string
          event_id: string
          storage_url: string
          ai_score: number | null
          category: PhotoCategory | null
          is_selected: boolean
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          storage_url: string
          ai_score?: number | null
          category?: PhotoCategory | null
          is_selected?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          storage_url?: string
          ai_score?: number | null
          category?: PhotoCategory | null
          is_selected?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'photos_event_id_fkey',
            columns: ['event_id'],
            isOneToOne: false,
            referencedRelation: 'events',
            referencedColumns: ['id'],
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

/** Nombres de tabla válidos, para genéricos de tipo. */
export type TableName = keyof Database['public']['Tables']
