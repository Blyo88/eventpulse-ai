'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface ResolveIncidentModalProps {
  incidentId: string
  trigger?: React.ReactNode
}

export default function ResolveIncidentModal({ incidentId, trigger }: ResolveIncidentModalProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const data = new FormData(e.currentTarget)
    const resolution_note = data.get('resolution_note') as string

    startTransition(async () => {
      try {
        const res = await fetch(`/api/incidents/${incidentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resolution_note }),
        })
        const json = await res.json()
        
        if (!res.ok) {
          setError(json.error ?? 'Error al resolver incidente')
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
      <div onClick={() => setOpen(true)} className="inline-block">
        {trigger || (
          <button className="neu-btn" style={{ fontSize: '0.75rem', padding: '6px 14px' }}>
            Resolver
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => !isPending && setOpen(false)}
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
            >
              <div className="neu-card w-full max-w-md" style={{ padding: '32px' }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 style={{ fontFamily: 'var(--font-nunito)', fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-primary)' }}>
                    Resolver Incidente
                  </h2>
                  <button
                    onClick={() => setOpen(false)}
                    className="neu-btn"
                    style={{ padding: '6px 10px', borderRadius: 'var(--r-md)' }}
                    aria-label="Cerrar"
                    disabled={isPending}
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

                  <div>
                    <label className="block mb-1.5"
                           style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      Nota de Resolución (Opcional)
                    </label>
                    <textarea
                      name="resolution_note"
                      placeholder="¿Cómo se solucionó?"
                      rows={3}
                      style={{
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
                      }}
                    />
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button type="button" onClick={() => setOpen(false)} disabled={isPending} className="neu-btn flex-1 justify-center">
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="neu-btn-primary flex-1 justify-center"
                      style={{ opacity: isPending ? 0.7 : 1, background: '#10b981', boxShadow: 'var(--shadow-soft-flat), 0 0 12px rgba(16,185,129,0.3)' }}
                    >
                      {isPending ? 'Resolviendo…' : 'Confirmar'}
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
