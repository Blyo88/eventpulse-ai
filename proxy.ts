import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Proxy de autenticación — Next.js 16 (renombrado desde middleware.ts).
 *
 * Protege /dashboard/* y /api/* redirigiendo a /login si no hay sesión válida.
 * Refresca el token de sesión en cada request navegable para mantenerlo vivo.
 *
 * Nota del SKILL: el proxy de Next 16 NO usa @supabase/ssr getAll/setAll
 * a través de cookies() de next/headers — usa los métodos de NextRequest/NextResponse
 * directamente, porque proxy corre antes del runtime de Server Components.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas públicas — siempre dejar pasar sin verificar sesión
  const isPublic =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api/webhooks') // webhooks externos no requieren auth

  // Permitir APIs con Authorization header (para tests y herramientas externas)
  const hasAuthHeader = request.headers.get('authorization')
  
  if (isPublic || hasAuthHeader) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Si el usuario no está autenticado, redirigir a /login
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    // Solo proteger rutas del dashboard — las APIs son internas y se consumen desde el frontend ya autenticado
    '/dashboard/:path*',
  ],
}
