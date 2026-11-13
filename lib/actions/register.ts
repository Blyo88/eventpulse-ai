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

  // Auto-crear organización personal y membership para el nuevo usuario
  if (signUpData.user) {
    try {
      const admin = createAdminClient()
      const userId = signUpData.user.id
      const email = parsed.data.email
      const orgName = email.split('@')[0] + ' Workspace'

      // Crear perfil público si no existe
      await admin
        .from('profiles')
        .upsert({
          id: userId,
          email: email,
        }, { onConflict: 'id' })

      // Crear organización personal
      const { data: org, error: orgError } = await admin
        .from('organizations')
        .insert({ name: orgName })
        .select('id')
        .single()

      if (org && !orgError) {
        // Crear membership como owner
        await admin
          .from('organization_members')
          .insert({
            organization_id: org.id,
            user_id: userId,
            role: 'owner',
          })
      }
    } catch (err) {
      // No bloquear el registro si falla la creación de org
      console.error('Error creando organización para nuevo usuario:', err)
    }
  }

  redirect('/login?registered=true')
}
