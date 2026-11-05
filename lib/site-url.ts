import 'server-only'
import { headers } from 'next/headers'

/**
 * Devuelve la URL pública del sitio (ej. https://eventepulseai.netlify.app).
 * Se usa para construir los enlaces de los emails de Supabase, para que
 * no apunten al "Site URL" por defecto (localhost:3000).
 */
export async function getSiteUrl(): Promise<string> {
  const h = await headers()

  const origin = h.get('origin')
  if (origin && origin !== 'null') return origin.replace(/\/$/, '')

  const host = h.get('x-forwarded-host') ?? h.get('host')
  if (host) {
    const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
    return `${proto}://${host}`
  }

  const envUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.URL
  return (envUrl ?? 'http://localhost:3000').replace(/\/$/, '')
}
