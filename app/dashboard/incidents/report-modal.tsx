'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import type { Tables } from '@/types/supabase'

interface ReportIncidentModalProps {
  events: Tables<'events'>[]
}

export default function ReportIncidentModal({ events }: ReportIncidentModalProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const data = new FormData(e.currentTarget)
    const body = {
      event_id: data.get('event_id') as string,
      category: data.get('category') as string,
      description: data.get('description') as string,
      severity: data.get('severity') as string,
    }

    if (!body.event_id) {
      setError('Selecciona un evento')
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/incidents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const json = await res.json()
        if (!res.ok) {
          setError(json.error ?? 'Error al reportar incidente')
          return
        }
        setOpen(false)
        router.refresh()
      } catch {
        setError('Error de red. Intenta de nuevo.')
      }
    })
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="neu-btn-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Reportar incidente
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(74, 85, 104, 0.25)', backdropFilter: 'blur(4px)' }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="incident-modal-title"
            >
              <div className="neu-card w-full max-w-md" style={{ padding: '32px' }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 id="incident-modal-title"
                      style={{ fontFamily: 'var(--font-nunito)', fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-primary)' }}>
                    Reportar incidente
                  </h2>
                  <button
                    onClick={() => setOpen(false)}
                    className="neu-btn"
                    style={{ padding: '6px 10px', borderRadius: 'var(--r-md)' }}
                    aria-label="Cerrar"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {error && (
                    <p className="text-sm text-center p-3"
                       style={{ background: 'rgba(229,62,62,0.1)', color: '#e53e3e', borderRadius: 'var(--r-md)' }}>
                      {error}
                    </p>
                  )}

                  {/* Selector de evento */}
                  <Field label="Evento *">
                    <select name="event_id" required style={selectStyle}>
                      <option value="">¿De qué evento es el incidente?</option>
                      {events.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.title} — {new Date(event.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Categoría *">
                    <select name="category" required style={selectStyle}>
                      <option value="">Tipo de incidente…</option>
                      <option value="logistics">Logística</option>
                      <option value="capacity">Capacidad</option>
                      <option value="hardware">Hardware</option>
                      <option value="software">Software</option>
                      <option value="other">Otro</option>
                    </select>
                  </Field>

                  <Field label="Severidad *">
                    <select name="severity" required style={selectStyle}>
                      <option value="">Nivel de urgencia…</option>
                      <option value="low">🟢 Baja</option>
                      <option value="medium">🟡 Media</option>
                      <option value="high">🔴 Alta</option>
                      <option value="critical">⛔ Crítica</option>
                    </select>
                  </Field>

                  <Field label="Descripción *">
                    <textarea
                      name="description"
                      required
                      placeholder="Describe el incidente con detalle (mín. 10 caracteres)…"
                      rows={4}
                      style={textareaStyle}
                    />
                  </Field>

                  <div className="flex gap-3 mt-2">
                    <button type="button" onClick={() => setOpen(false)} className="neu-btn flex-1 justify-center">
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isPending || events.length === 0}
                      className="neu-btn-primary flex-1 justify-center"
                      style={{ opacity: isPending ? 0.7 : 1 }}
                    >
                      {isPending ? 'Reportando…' : 'Reportar'}
                    </button>
                  </div>

                  {events.length === 0 && (
                    <p className="text-center text-xs" style={{ color: 'var(--text-muted)', marginTop: 4 }}>
                      Necesitas crear un evento primero para poder reportar incidentes.
                    </p>
                  )}
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block mb-1.5"
             style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: 'none',
  borderRadius: 'var(--r-pill)',
  boxShadow: 'var(--shadow-soft-inset)',
  color: 'var(--text-primary)',
  fontSize: '0.9rem',
  outline: 'none',
  padding: '12px 20px',
  width: '100%',
  cursor: 'pointer',
}

const textareaStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: 'none',
  borderRadius: '14px',
  boxShadow: 'var(--shadow-soft-inset)',
  color: 'var(--text-primary)',
  fontSize: '0.9rem',
  outline: 'none',
  padding: '12px 20px',
  resize: 'vertical',
  width: '100%',
}
