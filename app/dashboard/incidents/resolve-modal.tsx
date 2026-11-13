'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { resolveIncidentAction } from '@/lib/actions/incident'

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
        const result = await resolveIncidentAction(incidentId, resolution_note)
        
        if (!result.success) {
          setError(result.error ?? 'Error al actualizar incidente')
          return
        }
        
        setOpen(false)
        router.refresh()
      } catch {
        setError('Error inesperado. Intenta de nuevo.')
      }
    })
  }

  return (
    <>
      <div onClick={() => setOpen(true)} className="inline-block cursor-pointer">
        {trigger || (
          <button type="button" className="neu-btn" style={{ fontSize: '0.75rem', padding: '6px 14px' }}>
            Revisar / Resolver
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => !isPending && setOpen(false)}
              className="fixed inset-0"
              style={{ background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(6px)' }}
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
              className="neu-card w-full max-w-md relative z-10"
              style={{ padding: '28px', background: 'var(--surface-raised)', boxShadow: 'var(--shadow-md-raised)' }}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 style={{ fontFamily: 'var(--font-nunito)', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                    Resolver / Chequear Incidente
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Marca como resuelto o visto y registra las acciones tomadas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="neu-btn"
                  style={{ padding: '6px 10px', borderRadius: 'var(--r-md)' }}
                  aria-label="Cerrar"
                  disabled={isPending}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && (
                  <p className="text-xs text-center p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                    {error}
                  </p>
                )}

                <div className="flex flex-col gap-1.5">
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    ¿Cómo se solucionó o atendió? (Feedback / Auditoría)
                  </label>
                  <textarea
                    name="resolution_note"
                    placeholder="Ej: Se coordinó con soporte técnico y se reanudó la energía; o verificado por el equipo de logística..."
                    rows={4}
                    required
                    style={{
                      background: 'var(--surface)',
                      border: 'none',
                      borderRadius: '14px',
                      boxShadow: 'var(--shadow-soft-inset)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      outline: 'none',
                      padding: '12px 16px',
                      resize: 'vertical',
                      width: '100%',
                    }}
                  />
                </div>

                <div className="flex gap-3 mt-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={isPending}
                    className="neu-btn flex-1 justify-center py-2.5 text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="neu-btn-primary flex-1 justify-center py-2.5 text-sm font-bold"
                    style={{
                      opacity: isPending ? 0.7 : 1,
                      background: '#10b981',
                      boxShadow: 'var(--shadow-soft-flat), 0 0 12px rgba(16,185,129,0.3)',
                    }}
                  >
                    {isPending ? 'Guardando...' : '✓ Marcar como Resuelto'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
