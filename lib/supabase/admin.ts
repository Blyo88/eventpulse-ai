import 'server-only'

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

/**
 * Cliente Supabase con service role. Salta RLS.
 *
 * usarlo SOLO en el backend (Route Handlers, webhooks, jobs). El `import
 * 'server-only'` hace que Next.js falle el build si este módulo llega a un
 * Client Component: sin esa red de seguridad, la service role key se
 * empaquetaría en el bundle del navegador.
 *
 * Por qué la API lo necesita: un webhook de Typeform/Google Forms o una
 * llamada a `/api/events` no llevan sesión de Supabase, así que la anon key
 * no puede satisfacer las políticas owner-only. El backend es el límite de
 * confianza; RLS sigue protegiendo el acceso directo a PostgREST desde el
 * navegador con la anon key.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error('Missing env var: NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!serviceRoleKey) {
    throw new Error('Missing env var: SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      // El service role no debe persistir sesión ni refrescar tokens.
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}
