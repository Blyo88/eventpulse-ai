'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type { Tables } from '@/types/supabase'

interface AttendeeListProps {
  eventId: string
  attendees: Tables<'attendees'>[]
}

type ModalType = 'webhook' | 'manual' | null

export default function AttendeeList({ eventId, attendees }: AttendeeListProps) {
  const [modal, setModal] = useState<ModalType>(null)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({ full_name: '', email: '' })
  const router = useRouter()

  const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/forms`

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        const res = await fetch('/api/attendees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_id: eventId,
            full_name: formData.full_name,
            email: formData.email,
            registered_via: 'manual',
          }),
        })
        if (res.ok) {
          setFormData({ full_name: '', email: '' })
          setModal(null)
          router.refresh()
        }
      } catch (err) {
        console.error(err)
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Botones de control */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setModal('webhook')}
          className="neu-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          Vincular Formulario
        </button>
        <button
          onClick={() => setModal('manual')}
          className="neu-btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M16 11h6M19 8v6"/>
          </svg>
          + Añadir Manual
        </button>
      </div>

      {/* Lista de asistentes */}
      {attendees.length === 0 ? (
        <div className="neu-card flex flex-col items-center py-14 gap-3">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
               stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Usa los botones arriba para registrar asistentes
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {attendees.map((attendee) => {
            const fecha = new Date(attendee.created_at).toLocaleDateString('es-ES', {
              day: 'numeric', month: 'short', year: 'numeric',
            })
            return (
              <div
                key={attendee.id}
                className="flex items-center justify-between gap-4 px-4 py-3 rounded-2xl"
                style={{
                  background: 'var(--surface)',
                  boxShadow: 'var(--shadow-soft-flat)',
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="shrink-0 flex items-center justify-center rounded-full w-9 h-9"
                    style={{
                      background: 'var(--surface)',
                      boxShadow: 'var(--shadow-soft-raised)',
                      color: 'var(--accent)',
                      fontFamily: 'var(--font-nunito)',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                    }}
                  >
                    {attendee.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {attendee.full_name}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {attendee.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="neu-badge"
                    style={{
                      background: attendee.checked_in ? 'rgba(155,114,207,0.15)' : 'var(--surface-deep)',
                      color: attendee.checked_in ? 'var(--accent)' : 'var(--text-muted)',
                    }}
                  >
                    {attendee.checked_in ? '✓ Check-in' : 'Pendiente'}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{fecha}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal: Webhook */}
      <AnimatePresence>
        {modal === 'webhook' && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModal(null)}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(74, 85, 104, 0.25)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="neu-card w-full max-w-md" style={{ padding: '32px' }}>
                <h2 style={{ fontFamily: 'var(--font-nunito)', fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-primary)', marginBottom: 16 }}>
                  Vincular Formulario Externo
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 16, lineHeight: 1.5 }}>
                  Usa esta URL en tu formulario externo para registrar automáticamente asistentes en este evento:
                </p>

                <div className="flex gap-2 mb-6">
                  <input
                    type="text"
                    value={webhookUrl}
                    readOnly
                    className="neu-input flex-1"
                    style={{ fontSize: '0.75rem' }}
                  />
                  <button
                    onClick={copyWebhook}
                    className="neu-btn-primary"
                    style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}
                  >
                    {copied ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 16, fontStyle: 'italic' }}>
                  POST payload esperado: <code>{'{ full_name, email, event_id }'}</code>
                </p>

                <button
                  onClick={() => setModal(null)}
                  className="neu-btn w-full justify-center"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal: Añadir Manual */}
      <AnimatePresence>
        {modal === 'manual' && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModal(null)}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(74, 85, 104, 0.25)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="neu-card w-full max-w-md" style={{ padding: '32px' }}>
                <h2 style={{ fontFamily: 'var(--font-nunito)', fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-primary)', marginBottom: 20 }}>
                  Añadir Asistente Manual
                </h2>

                <form onSubmit={handleAddManual} className="flex flex-col gap-4">
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Ej. Juan Pérez"
                      className="neu-input"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="correo@ejemplo.com"
                      className="neu-input"
                    />
                  </div>

                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setModal(null)}
                      className="neu-btn flex-1 justify-center"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="neu-btn-primary flex-1 justify-center"
                      style={{ opacity: isPending ? 0.7 : 1 }}
                    >
                      {isPending ? 'Añadiendo...' : 'Añadir'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
