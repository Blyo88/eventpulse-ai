import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { User } from '@supabase/supabase-js'
import type { Tables } from '@/types/supabase'

export type AuthContext = {
  user: User
  userId: string
  organizationId: string | null
}

/** Error que pueden traducir los Route Handlers a una respuesta HTTP. */
export class AuthError extends Error {
  readonly status: 401 | 403 | 404

  constructor(message: string, status: 401 | 403 | 404 = 401) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}

/**
 * Obtiene el usuario autenticado y la primera organización a la que pertenece.
 * Si el usuario no tiene ninguna organización, se le crea automáticamente una
 * organización personal y un membership como owner.
 */
export async function getAuthUser(): Promise<AuthContext> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new AuthError('No autenticado', 401)
  }

  const admin = createAdminClient()
  const { data: membership, error: membershipError } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (membershipError) {
    console.error('Error buscando la organización del usuario:', membershipError.message)
  }

  // Si el usuario existe pero no tiene organización, crearle una automáticamente
  if (!membership?.organization_id && user.email) {
    try {
      const orgName = (user.email.split('@')[0] || 'Mi') + ' Workspace'
      const { data: newOrg } = await admin
        .from('organizations')
        .insert({ name: orgName })
        .select('id')
        .single()

      if (newOrg) {
        await admin.from('organization_members').insert({
          organization_id: newOrg.id,
          user_id: user.id,
          role: 'owner',
        })
        // Asegurarse de que el perfil exista
        await admin.from('profiles').upsert({ id: user.id, email: user.email }, { onConflict: 'id' })

        return { user, userId: user.id, organizationId: newOrg.id }
      }
    } catch (err) {
      console.error('Error creando organización automática:', err)
    }
  }

  return {
    user,
    userId: user.id,
    organizationId: membership?.organization_id || null,
  }
}

/** Devuelve null para integraciones públicas que no llevan sesión. */
export async function getAuthUserOptional(): Promise<AuthContext | null> {
  try {
    return await getAuthUser()
  } catch {
    return null
  }
}

/** Comprueba que una organización pertenece al usuario autenticado. */
export async function assertOrganizationAccess(
  organizationId: string,
  userId: string,
): Promise<void> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) {
    throw new AuthError('No tienes acceso a esta organización', 403)
  }
}

/**
 * Comprueba que un evento pertenece a la organización del usuario.
 * Es obligatorio llamarlo antes de leer o mutar attendees, incidents, photos
 * o análisis asociados al evento.
 */
export async function assertEventAccess(
  eventId: string,
  organizationId: string,
): Promise<Tables<'events'>> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (error || !data) {
    throw new AuthError('Evento no encontrado o sin permisos', 404)
  }

  return data
}

/** Comprueba que un incidente pertenece a un evento de la organización. */
export async function assertIncidentAccess(
  incidentId: string,
  organizationId: string,
): Promise<void> {
  const admin = createAdminClient()
  const { data: incident, error: incidentError } = await admin
    .from('incidents')
    .select('event_id')
    .eq('id', incidentId)
    .maybeSingle()

  if (incidentError || !incident) {
    throw new AuthError('Incidente no encontrado', 404)
  }

  await assertEventAccess(incident.event_id, organizationId)
}

/** Comprueba que un análisis pertenece a un evento de la organización. */
export async function assertAnalysisAccess(
  eventId: string,
  organizationId: string,
): Promise<void> {
  await assertEventAccess(eventId, organizationId)
}

/** Comprueba que todas las fotos pertenecen a eventos de la organización. */
export async function assertPhotoAccess(
  photoIds: string[],
  organizationId: string,
): Promise<void> {
  if (photoIds.length === 0) return

  const admin = createAdminClient()
  const { data: photos, error: photosError } = await admin
    .from('photos')
    .select('id, event_id')
    .in('id', photoIds)

  if (photosError || !photos || photos.length !== photoIds.length) {
    throw new AuthError('Una o más fotos no existen', 404)
  }

  const eventIds = [...new Set(photos.map((photo) => photo.event_id))]
  const { data: events, error: eventsError } = await admin
    .from('events')
    .select('id')
    .in('id', eventIds)
    .eq('organization_id', organizationId)

  if (eventsError || !events || events.length !== eventIds.length) {
    throw new AuthError('No tienes acceso a una o más fotos', 403)
  }
}

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return { error: error.message, status: error.status }
  }
  if (error instanceof Error && error.message === 'No autenticado') {
    return { error: error.message, status: 401 as const }
  }
  return null
}
