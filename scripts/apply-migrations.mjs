/**
 * Aplica los archivos de `supabase/migrations/*.sql` en orden lexicografico y
 * registra cada uno aplicado en la tabla `schema_migrations`, asi que es
 * idempotente: correrlo dos veces no repite nada.
 *
 * Conexion (en este orden de precedencia):
 *   1. DATABASE_URL
 *   2. PGHOST / PGPORT / PGUSER / PGPASSWORD / PGDATABASE
 *
 * El password admite URL-encoding. Si viene envuelto en corchetes —copiarlo
 * del dashboard de Supabase a veces los incluye— se prueban ambas variantes.
 *
 * Uso:  node scripts/apply-migrations.mjs
 *       node scripts/apply-migrations.mjs --dry-run
 */

import { Client } from 'pg'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'supabase', 'migrations')
const DRY_RUN = process.argv.includes('--dry-run')

/** Lee .env.local para que el script funcione sin exportar variables a mano. */
function loadEnvLocal() {
  const path = join(MIGRATIONS_DIR, '..', '..', '.env.local')
  let raw
  try {
    raw = readFileSync(path, 'utf8')
  } catch {
    return
  }

  for (const line of raw.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    let v = t.slice(i + 1).trim()
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1)
    if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1)
    if (!(t.slice(0, i).trim() in process.env)) process.env[t.slice(0, i).trim()] = v
  }
}
loadEnvLocal()

/**
 * Construye la lista de configs candidatas de `pg`.
 * Se parsea el URI solo para extraer host/port/user, y la conexion se arma con
 * un objeto de config explicito: `pg` no necesita que el password sea
 * URL-safe, asi que un password con caracteres reservados no lo rompe.
 */
function buildConfigs() {
  const configs = []

  if (process.env.DATABASE_URL) {
    try {
      const u = new URL(process.env.DATABASE_URL)
      configs.push({
        host: u.hostname,
        port: Number(u.port || 5432),
        user: decodeURIComponent(u.username),
        password: decodeURIComponent(u.password),
        database: decodeURIComponent(u.pathname.replace(/^\//, '')) || 'postgres',
      })
    } catch (e) {
      console.error(`DATABASE_URL no es valida: ${e.message}`)
      process.exit(1)
    }
  } else if (process.env.PGHOST) {
    configs.push({
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD ?? '',
      database: process.env.PGDATABASE || 'postgres',
    })
  }

  // Si el password vino envuelto en corchetes, prueba tambien la variante limpia.
  const expanded = []
  for (const c of configs) {
    expanded.push(c)
    const p = c.password ?? ''
    if (p.startsWith('[') && p.endsWith(']')) {
      expanded.push({ ...c, password: p.slice(1, -1) })
    }
  }
  return expanded
}

const configs = buildConfigs()
if (configs.length === 0) {
  console.error('Falta la conexion. Define DATABASE_URL o PGHOST/PGUSER/PGPASSWORD.')
  process.exit(1)
}

/** Conecta probando cada config hasta que una funcione. */
async function connect() {
  const failures = []
  for (const [i, config] of configs.entries()) {
    const client = new Client({ ...config, ssl: { rejectUnauthorized: false } })
    try {
      await client.connect()
      const version = await client.query('select version()')
      console.log(`Conectado a ${config.host}:${config.port}/${config.database}`)
      console.log(`  ${version.rows[0].version.split(',')[0]}`)
      if (i > 0) console.log('  (se uso la variante del password sin corchetes)')
      return client
    } catch (e) {
      failures.push(e.message)
      await client.end().catch(() => {})
    }
  }
  console.error('No se pudo conectar:')
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}

const client = await connect()

const files = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort()

if (files.length === 0) {
  console.error('No hay migraciones en supabase/migrations/')
  await client.end()
  process.exit(1)
}

await client.query(`
  create table if not exists public.schema_migrations (
    name       text primary key,
    applied_at timestamptz not null default now()
  )
`)

const { rows: applied } = await client.query('select name from public.schema_migrations')
const done = new Set(applied.map((r) => r.name))

console.log('')
let count = 0

for (const file of files) {
  if (done.has(file)) {
    console.log(`  = ${file} (ya aplicada)`)
    continue
  }

  const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8')

  if (DRY_RUN) {
    console.log(`  ? ${file} (dry-run, ${sql.split('\n').length} lineas)`)
    continue
  }

  process.stdout.write(`  > ${file} ... `)
  try {
    await client.query('begin')
    await client.query(sql)
    await client.query('insert into public.schema_migrations (name) values ($1)', [file])
    await client.query('commit')
    console.log('OK')
    count++
  } catch (e) {
    await client.query('rollback').catch(() => {})
    console.log('FALLO')
    console.error(`\n${e.message}\n`)
    if (e.position) {
      const pos = Number(e.position)
      const upto = sql.slice(0, pos)
      const line = upto.split('\n').length
      console.error(`  cerca de la linea ${line}: ${sql.split('\n')[line - 1]?.trim()}`)
    }
    await client.end()
    process.exit(1)
  }
}

// Verificacion final
const { rows: tables } = await client.query(`
  select table_name, (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from public.%I', table_name), false, true, '')))[1]::text::bigint as rows
  from information_schema.tables
  where table_schema = 'public' and table_type = 'BASE TABLE'
  order by table_name
`)

console.log('\n  Tablas en public:')
for (const t of tables) {
  console.log(`    ${t.table_name.padEnd(16)} ${t.rows} fila(s)`)
}

console.log(`\n${DRY_RUN ? 'Dry-run: ' : ''}${count} migracion(es) aplicada(s).\n`)

await client.end()
