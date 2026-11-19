'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function createWorkspaceAction(name: string): Promise<{ success: boolean; error?: string }> {
  if (!name || name.trim().length < 2) {
    return { success: false, error: 'El nombre debe tener al menos 2 caracteres.' }
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'No estás autenticado.' }
  }

  const admin = createAdminClient()

  // Verificar que aún no tenga organización para evitar duplicados
  const { data: existing } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (existing?.organization_id) {
    // Ya tiene organización, no crear otra
    return { success: true }
  }

  // Crear organización
  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({ name: name.trim() })
    .select('id')
    .single()

  if (orgError || !org) {
    console.error('Error creando organización:', orgError)
    return { success: false, error: 'No se pudo crear el espacio de trabajo. Intenta de nuevo.' }
  }

  // Crear membership como owner
  const { error: memberError } = await admin
    .from('organization_members')
    .insert({
      organization_id: org.id,
      user_id: user.id,
      role: 'owner',
    })

  if (memberError) {
    console.error('Error creando membership:', memberError)
    return { success: false, error: 'Espacio creado pero no se pudo asignar el rol. Contacta soporte.' }
  }

  // Asegurar que el perfil existe
  await admin.from('profiles').upsert(
    { id: user.id, email: user.email ?? '' },
    { onConflict: 'id' }
  )

  return { success: true }
}
