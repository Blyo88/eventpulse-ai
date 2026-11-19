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
              style={{ background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto"
            >
              <div className="neu-card w-full max-w-lg my-auto flex flex-col gap-5"
                   style={{ padding: '28px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '90vh', overflowY: 'auto' }}>

                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-nunito)', fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                      Vincular Formulario Externo
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 2 }}>
                      Conecta Google Forms, Typeform u otro formulario para registrar asistentes automáticamente.
                    </p>
                  </div>
                  <button onClick={() => setModal(null)} className="neu-btn" style={{ padding: '6px 10px' }} aria-label="Cerrar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>

                {/* Datos clave */}
                <div className="flex flex-col gap-3 p-4 rounded-2xl" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-soft-inset)' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    1. URL del Webhook — pégala en Zapier o Make
                  </p>
                  <div className="flex gap-2 items-center flex-wrap">
                    <code className="flex-1 text-xs break-all" style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>{webhookUrl}</code>
                    <button onClick={copyWebhook} className="neu-btn shrink-0" style={{ fontSize: '0.75rem', padding: '6px 12px', whiteSpace: 'nowrap', color: copied ? '#10b981' : undefined }}>
                      {copied ? '✓ Copiado' : 'Copiar URL'}
                    </button>
                  </div>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 4 }}>
                    2. ID de este evento — inclúyelo como campo oculto en el formulario
                  </p>
                  <div className="flex gap-2 items-center flex-wrap">
                    <code className="flex-1 text-xs break-all" style={{ color: '#f59e0b', fontFamily: 'monospace' }}>{eventId}</code>
                    <button
                      onClick={() => { navigator.clipboard.writeText(eventId) }}
                      className="neu-btn shrink-0"
                      style={{ fontSize: '0.75rem', padding: '6px 12px', whiteSpace: 'nowrap' }}
                    >
                      Copiar ID
                    </button>
                  </div>
                </div>

                {/* Instrucciones paso a paso */}
                <div className="flex flex-col gap-4">
                  <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>📋 Cómo conectarlo con Google Forms + Zapier:</p>

                  {[
                    {
                      n: 1,
                      title: 'Crea tu Google Form',
                      body: 'Ve a forms.google.com. Añade dos preguntas obligatorias: "Nombre completo" (respuesta corta) y "Correo electrónico".',
                    },
                    {
                      n: 2,
                      title: 'Entra a Zapier y crea un Zap',
                      body: 'Trigger: Google Forms → "New Form Response". Selecciona el formulario que creaste. Action: Webhooks by Zapier → "POST".',
                    },
                    {
                      n: 3,
                      title: 'Configura el POST en Zapier',
                      body: `URL: la de arriba. Payload (JSON): { "event_id": "<ID del evento>", "full_name": {{campo nombre}}, "email": {{campo email}} }`,
                    },
                    {
                      n: 4,
                      title: 'Prueba y activa el Zap',
                      body: 'Envía una respuesta de prueba en el formulario. Verifica que aparezca en la lista de Asistentes. Luego activa el Zap.',
                    },
                  ].map(step => (
                    <div key={step.n} className="flex gap-3">
                      <div className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                           style={{ background: 'rgba(99,102,241,0.18)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}>
                        {step.n}
                      </div>
                      <div>
                        <p className="font-bold text-xs mb-1" style={{ color: 'var(--text-primary)' }}>{step.title}</p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{step.body}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Nota Make */}
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12, lineHeight: 1.6 }}>
                  ¿Usas <strong style={{ color: 'var(--text-primary)' }}>Make (Integromat)</strong>? El proceso es igual: Google Forms → HTTP → Make a request (POST) con la misma URL y los campos <code style={{ color: 'var(--accent)' }}>event_id</code>, <code style={{ color: 'var(--accent)' }}>full_name</code> y <code style={{ color: 'var(--accent)' }}>email</code>.
                </p>

                <button onClick={() => setModal(null)} className="neu-btn w-full justify-center">
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
