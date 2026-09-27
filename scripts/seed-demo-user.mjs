/**
 * Crea el usuario demo en `auth.users` con el UUID que espera
 * `DEMO_USER_ID` (lib/services/event.service.ts).
 *
 * Es obligatorio: `events.user_id` tiene `REFERENCES auth.users(id)`, asi que
 * sin esta fila el POST /api/events falla con una violacion de FK (500).
 *
 * Uso:  node scripts/seed-demo-user.mjs
 * Idempotente: si el usuario ya existe, no hace nada.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001'
const DEMO_EMAIL = 'demo@eventpulse.ai'
const DEMO_PASSWORD = 'EventPulse2026!'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Lee .env.local a mano para no depender de dotenv. */
function loadEnvLocal() {
  const envPath = join(projectRoot, '.env.local')
  const raw = readFileSync(envPath, 'utf8')

  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const eq = trimmed.indexOf('=')
    if (eq === -1) continue

    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
}

loadEnvLocal()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: existing, error: lookupError } = await supabase.auth.admin.getUserById(DEMO_USER_ID)

// `getUserById` reporta "no existe" como error 404, no como `data: null`.
const alreadyExists = Boolean(existing?.user)
const notFound = lookupError?.status === 404 || /not found/i.test(lookupError?.message ?? '')

if (lookupError && !notFound) {
  console.error('Error consultando el usuario demo:', lookupError.message)
  process.exit(1)
}

if (alreadyExists) {
  console.log(`Usuario demo ya existe: ${existing.user.id} (${existing.user.email})`)
  process.exit(0)
}

const { data, error } = await supabase.auth.admin.createUser({
  id: DEMO_USER_ID,
  email: DEMO_EMAIL,
  password: DEMO_PASSWORD,
  email_confirm: true,
})

if (error) {
  console.error('Error creando el usuario demo:', error.message)
  process.exit(1)
}

console.log(`Usuario demo creado: ${data.user.id} (${data.user.email})`)
console.log(`Password: ${DEMO_PASSWORD}`)
