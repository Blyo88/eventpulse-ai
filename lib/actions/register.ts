'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export type RegisterState = {
  error: string | null
  fieldErrors?: { email?: string[]; password?: string[]; confirmPassword?: string[] }
}

export async function registerAction(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  }

  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      error: 'Datos inválidos',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()
  const { data: signUpData, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    if (error.code === 'user_already_exists') {
      return { error: 'Ya existe una cuenta con este email' }
    }
    return { error: error.message }
  }

  // Crear organización personal y membership para el nuevo usuario
  if (signUpData.user) {
    const admin = createAdminClient()
    const userId = signUpData.user.id
    const email = parsed.data.email
    // Nombre de org derivado del email, limpio y legible
    const localPart = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').trim()
    const orgName = localPart.charAt(0).toUpperCase() + localPart.slice(1) + ' Workspace'

    try {
      // Crear organización personal
      const { data: org, error: orgError } = await admin
        .from('organizations')
        .insert({ name: orgName })
        .select('id')
        .single()

      if (org && !orgError) {
        // Crear membership como owner
        await admin.from('organization_members').insert({
          organization_id: org.id,
          user_id: userId,
          role: 'owner',
        })

        // Crear perfil si la tabla existe
        try {
          await admin.from('profiles').upsert(
            { id: userId, email },
            { onConflict: 'id' }
          )
        } catch {
          // La tabla profiles puede no existir aún, no es bloqueante
        }
      } else {
        console.error('Error creando organización para nuevo usuario:', orgError?.message)
      }
    } catch (err) {
      // Nunca bloquear el registro si esto falla — getAuthUser lo recupera al primer login
      console.error('Error en setup post-registro:', err)
    }
  }

  redirect('/login?registered=true')
}
