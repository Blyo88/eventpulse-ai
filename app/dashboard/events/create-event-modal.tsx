'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000000'

export default function CreateEventModal() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const firstRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => firstRef.current?.focus(), 50)
  }, [open])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const data = new FormData(e.currentTarget)
    
    const dateVal = data.get('date') as string
    let parsedDate = dateVal
    try {
      const d = new Date(dateVal)
      if (!isNaN(d.getTime())) {
        parsedDate = d.toISOString()
      }
    } catch {
      // fallback
    }

    const body = {
      organization_id: DEMO_ORG_ID,
      title: data.get('title') as string,
      description: (data.get('description') as string) || undefined,
      date: parsedDate,
      location: (data.get('location') as string) || undefined,
      capacity: Number(data.get('capacity')) || 0,
      is_virtual: data.get('is_virtual') === 'true',
      enable_check_in: data.get('enable_check_in') === 'true',
      enable_location_heat_map: data.get('enable_location_heat_map') === 'true',
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-organization-id': DEMO_ORG_ID
          },
          body: JSON.stringify(body),
        })
        const json = await res.json()
        if (!res.ok) {
          const detailMsg = Array.isArray(json.details) && json.details.length > 0
            ? json.details.map((d: { message: string }) => d.message).join('. ')
            : null
          setError(detailMsg || json.error || 'Error al crear el evento')
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
        Nuevo evento
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(74, 85, 104, 0.25)', backdropFilter: 'blur(4px)' }}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              <div className="neu-card w-full max-w-md" style={{ padding: '32px' }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 id="modal-title"
                      style={{ fontFamily: 'var(--font-nunito)', fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-primary)' }}>
                    Crear nuevo evento
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
                    <p className="text-sm text-center p-3 rounded-xl"
                       style={{ background: 'rgba(229,62,62,0.1)', color: '#e53e3e', borderRadius: 'var(--r-md)' }}>
                      {error}
                    </p>
                  )}

                  <Field label="Título *">
                    <input ref={firstRef} name="title" required placeholder="Ej. Congreso de innovación 2026"
                           className="neu-input" />
                  </Field>

                  <Field label="Descripción">
                    <textarea name="description" placeholder="Descripción opcional…"
                              rows={3}
                              style={{
                                background: 'var(--surface)',
                                border: 'none',
                                borderRadius: 'var(--r-md)',
                                boxShadow: 'var(--shadow-soft-inset)',
                                color: 'var(--text-primary)',
                                fontSize: '0.9rem',
                                outline: 'none',
                                padding: '12px 20px',
                                resize: 'vertical',
                                width: '100%',
                              }} />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Fecha y hora *">
                      <input name="date" type="datetime-local" required className="neu-input" style={{ padding: '11px 16px' }} />
                    </Field>
                    <Field label="Capacidad">
                      <input name="capacity" type="number" min={0} placeholder="0" className="neu-input" />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 gap-2 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="is_virtual" value="true" className="accent-[var(--accent)]" />
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Es un evento Virtual</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="enable_check_in" value="true" className="accent-[var(--accent)]" />
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Habilitar Check-in</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="enable_location_heat_map" value="true" className="accent-[var(--accent)]" />
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Habilitar Mapa de Calor (Opcional)</span>
                    </label>
                  </div>

                  <div className="flex gap-3 mt-2">
                    <button type="button" onClick={() => setOpen(false)} className="neu-btn flex-1 justify-center">
                      Cancelar
                    </button>
                    <button type="submit" disabled={isPending} className="neu-btn-primary flex-1 justify-center"
                            style={{ opacity: isPending ? 0.7 : 1 }}>
                      {isPending ? 'Guardando…' : 'Crear evento'}
                    </button>
                  </div>
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
