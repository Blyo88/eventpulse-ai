/**
 * Smoke test end-to-end contra el backend de EventPulse AI.
 *
 *   node scripts/smoke-api.mjs
 *
 * Requiere el dev server corriendo (`npm run dev`) y el schema aplicado.
 * Crea datos y los limpia al final.
 */

const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000'

let passed = 0
let failed = 0

function check(label, condition, detail = '') {
  if (condition) {
    passed++
    console.log(`  PASS  ${label}`)
  } else {
    failed++
    console.log(`  FAIL  ${label}${detail ? ` -> ${detail}` : ''}`)
  }
}

async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  let json = null
  const text = await res.text()
  try {
    json = JSON.parse(text)
  } catch {
    json = { raw: text }
  }
  return { status: res.status, body: json }
}

console.log(`\nEventPulse AI — smoke test contra ${BASE}\n`)

// ── 1. Health del schema ────────────────────────────────────────────
console.log('1. Esquema y listado')
const list0 = await call('GET', '/api/events')
check('GET /api/events responde 200', list0.status === 200, `status ${list0.status}: ${JSON.stringify(list0.body)}`)
check(
  'el schema esta aplicado (no hay error de schema cache)',
  !String(list0.body?.error ?? '').includes('schema cache'),
  list0.body?.error,
)
const initialCount = Array.isArray(list0.body?.data) ? list0.body.data.length : -1
check('GET /api/events devuelve un array', initialCount >= 0, `data=${JSON.stringify(list0.body?.data)}`)

// ── 2. Crear evento ────────────────────────────────────────────────
console.log('\n2. Crear evento')
const created = await call('POST', '/api/events', {
  title: 'Smoke Test — Taller Next.js',
  description: 'Evento creado por scripts/smoke-api.mjs',
  date: '2026-12-01T18:00:00.000Z',
  location: 'Bogota, Colombia',
  capacity: 50,
})
check('POST /api/events responde 201', created.status === 201, `status ${created.status}: ${JSON.stringify(created.body)}`)

const eventId = created.body?.data?.id
check('el evento trae id uuid', typeof eventId === 'string' && eventId.length === 36, `id=${eventId}`)
check('status inicial es draft', created.body?.data?.status === 'draft', created.body?.data?.status)

const invalidEvent = await call('POST', '/api/events', { title: '', date: 'no-es-una-fecha' })
check(
  'POST /api/events con body invalido responde 400',
  invalidEvent.status === 400,
  `status ${invalidEvent.status}: ${JSON.stringify(invalidEvent.body)}`,
)
check('el 400 incluye issues de Zod', Array.isArray(invalidEvent.body?.details), JSON.stringify(invalidEvent.body?.details))

// ── 3. Webhook: alta de asistentes ──────────────────────────────────
console.log('\n3. Webhook de formularios')
const stamp = Date.now()
const attendee1 = {
  event_id: eventId ?? '00000000-0000-0000-0000-000000000000',
  full_name: 'Smoke Test Uno',
  email: `smoke1.${stamp}@example.com`,
}
const reg1 = await call('POST', '/api/webhooks/forms', attendee1)
check('POST /api/webhooks/forms responde 201', reg1.status === 201, `status ${reg1.status}: ${JSON.stringify(reg1.body)}`)
check('el asistente nace con checked_in=false', reg1.body?.data?.checked_in === false, JSON.stringify(reg1.body?.data))
check('registered_via es "webhook"', reg1.body?.data?.registered_via === 'webhook', reg1.body?.data?.registered_via)

const reg2 = await call('POST', '/api/webhooks/forms', {
  ...attendee1,
  full_name: 'Smoke Test Dos',
  email: `smoke2.${stamp}@example.com`,
})
check('segundo asistente responde 201', reg2.status === 201, `status ${reg2.status}: ${JSON.stringify(reg2.body)}`)

const dup = await call('POST', '/api/webhooks/forms', attendee1)
check('duplicado responde 409', dup.status === 409, `status ${dup.status}: ${JSON.stringify(dup.body)}`)

const bad = await call('POST', '/api/webhooks/forms', {
  event_id: 'no-es-uuid',
  full_name: '',
  email: 'correo-malo',
})
check('payload invalido responde 400', bad.status === 400, `status ${bad.status}: ${JSON.stringify(bad.body)}`)

// ── 4. Persistencia ────────────────────────────────────────────────
console.log('\n4. Persistencia')
const list1 = await call('GET', '/api/events')
check(
  'el evento nuevo aparece en el listado',
  Array.isArray(list1.body?.data) && list1.body.data.some((e) => e.id === eventId),
  `count=${list1.body?.count}`,
)
check(
  'el listado crecio en 1',
  Array.isArray(list1.body?.data) && list1.body.data.length === initialCount + 1,
  `antes=${initialCount} ahora=${list1.body?.data?.length}`,
)

// ── Cleanup ─────────────────────────────────────────────────────────
if (eventId) {
  const { createClient } = await import('@supabase/supabase-js')
  const { readFileSync } = await import('node:fs')

  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    let v = t.slice(i + 1).trim()
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1)
    process.env[t.slice(0, i).trim()] = v
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  // attendees cae por ON DELETE CASCADE al borrar el evento
  const { error } = await admin.from('events').delete().eq('id', eventId)
  console.log(`\nCleanup: ${error ? 'fallo -> ' + error.message : `evento ${eventId} y sus asistentes eliminados`}`)
}

// ── Resultado ──────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(52)}`)
console.log(`  ${passed} passaram, ${failed} falharam`)
console.log(`${'─'.repeat(52)}\n`)
process.exit(failed === 0 ? 0 : 1)
