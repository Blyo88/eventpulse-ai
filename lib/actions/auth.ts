'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Credenciales del usuario demo (creado por seed-demo-user.mjs)
const DEMO_EMAIL = 'demo@eventpulse.ai'
const DEMO_PASSWORD = 'EventPulse2026!'

const loginSchema = z.object({
  email: z.email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export type LoginState = {
  error: string | null
  fieldErrors?: { email?: string[]; password?: string[] }
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      error: 'Datos inválidos',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: 'Email o contraseña incorrectos' }
  }

  redirect('/dashboard/events')
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

/**
 * Inicia sesión como usuario demo temporal.
 * Los datos son de demostración y se comparten entre todas las sesiones demo.
 */
export async function guestLoginAction(): Promise<{ error: string } | never> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  })

  if (error) {
    return { error: 'La sesión de demostración no está disponible en este momento.' }
  }

  redirect('/dashboard/events')
}
