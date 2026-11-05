import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

/**
 * Destino del enlace de verificación de email de Supabase.
 * Soporta el flujo PKCE (?code=...) y el flujo con token_hash (?token_hash=...&type=...).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const nextParam = searchParams.get('next') ?? '/dashboard/events'
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/dashboard/events'

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, origin))
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) return NextResponse.redirect(new URL(next, origin))
  }

  // Si el enlace se abrió en otro navegador/dispositivo, Supabase ya confirmó
  // el email pero no se puede crear la sesión aquí: pedimos iniciar sesión.
  const errorDesc = searchParams.get('error_description')
  const loginUrl = new URL('/login', origin)
  loginUrl.searchParams.set(errorDesc ? 'verify_error' : 'verified', errorDesc ? '1' : 'true')
  return NextResponse.redirect(loginUrl)
}
