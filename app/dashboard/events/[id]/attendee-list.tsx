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
type WebhookTab = 'apps-script' | 'zapier' | 'make'

// ── Reutilizable: copia con feedback visual por key ──────────────────────────
function useCopy() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }
  return { copiedKey, copy }
}

// ── Bloque de código copiable ─────────────────────────────────────────────────
function CodeBlock({
  label, value, copyKey, copiedKey, onCopy, color = '#a5b4fc',
}: {
  label: string
  value: string
  copyKey: string
  copiedKey: string | null
  onCopy: (text: string, key: string) => void
  color?: string
}) {
  const isCopied = copiedKey === copyKey
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span style={{ fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          {label}
        </span>
        <button
          type="button"
          onClick={() => onCopy(value, copyKey)}
          style={{
            fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px',
            borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: isCopied ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
            color: isCopied ? '#10b981' : '#a5b4fc',
            transition: 'all 0.2s',
          }}
        >
          {isCopied ? '✓ Copiado' : 'Copiar'}
        </button>
      </div>
      <div style={{
        background: 'var(--surface)', boxShadow: 'var(--shadow-soft-inset)',
        borderRadius: '12px', padding: '10px 14px', overflowX: 'auto',
      }}>
        <pre style={{ margin: 0, fontSize: '0.71rem', color, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.65 }}>
          {value}
        </pre>
      </div>
    </div>
  )
}

// ── Pestaña interna del modal ─────────────────────────────────────────────────
function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '5px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
        fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.18s',
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? '#fff' : 'var(--text-muted)',
        boxShadow: active ? '0 0 10px rgba(155,114,207,0.35)' : 'none',
      }}
    >
      {children}
    </button>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function AttendeeList({ eventId, attendees }: AttendeeListProps) {
  const [modal, setModal] = useState<ModalType>(null)
  const [webhookTab, setWebhookTab] = useState<WebhookTab>('apps-script')
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({ full_name: '', email: '' })
  const router = useRouter()
  const { copiedKey, copy } = useCopy()

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tu-dominio.vercel.app'
  const webhookUrl = `${origin}/api/webhooks/forms`

  // Snippets precargados con los valores reales del evento
  const jsonPayload = `{
  "event_id":  "${eventId}",
  "full_name": "Nombre Apellido",
  "email":     "correo@ejemplo.com"
}`

  const appsScript = `// 1. Abre tu Google Form → Extensiones → Apps Script
// 2. Borra todo, pega este código y guarda (Ctrl+S)
// 3. Ejecuta la función "configurar" una sola vez para instalar el trigger
// 4. ¡Listo! Cada respuesta nueva enviará los datos a EventPulse.

const WEBHOOK_URL = "${webhookUrl}";
const EVENT_ID    = "${eventId}";

function onFormSubmit(e) {
  const responses = e.response.getItemResponses();
  const get = (keyword) => {
    const found = responses.find(r =>
      r.getItem().getTitle().toLowerCase().includes(keyword)
    );
    return found ? found.getResponse() : "";
  };

  UrlFetchApp.fetch(WEBHOOK_URL, {
    method      : "post",
    contentType : "application/json",
    payload     : JSON.stringify({
      event_id  : EVENT_ID,
      full_name : get("nombre"),
      email     : get("correo") || get("email"),
    }),
  });
}

function configurar() {
  const form = FormApp.getActiveForm();
  ScriptApp.newTrigger("onFormSubmit")
    .forForm(form)
    .onFormSubmit()
    .create();
  Logger.log("Trigger instalado en: " + form.getTitle());
}`

  const zapierSteps = `Trigger : Google Forms → New Form Response
Action  : Webhooks by Zapier → POST

URL     : ${webhookUrl}
Payload :
  event_id  = ${eventId}   ← valor fijo
  full_name = {{Nombre completo}}   ← campo del form
  email     = {{Correo electrónico}} ← campo del form`

  const makePayload = `// Make → módulo "HTTP › Make a request"
// Method: POST   Content-Type: application/json

{
  "event_id"  : "${eventId}",
  "full_name" : "{{1.responses[0].value}}",
  "email"     : "{{1.responses[1].value}}"
}

// Ajusta los índices [0], [1] al orden de tus preguntas en el form.`

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
                style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-soft-flat)' }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="shrink-0 flex items-center justify-center rounded-full w-9 h-9"
                    style={{
                      background: 'var(--surface)', boxShadow: 'var(--shadow-soft-raised)',
                      color: 'var(--accent)', fontFamily: 'var(--font-nunito)',
                      fontWeight: 700, fontSize: '0.875rem',
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

      {/* ── Modal: Vincular Formulario ────────────────────────────────────────── */}
      <AnimatePresence>
        {modal === 'webhook' && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModal(null)}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(15,23,42,0.78)', backdropFilter: 'blur(8px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 14 }}
              transition={{ duration: 0.24, ease: [0.34, 1.56, 0.64, 1] }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto"
            >
              <div
                className="neu-card w-full max-w-lg my-auto flex flex-col gap-5"
                style={{
                  padding: '26px', borderRadius: '24px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  maxHeight: '92vh', overflowY: 'auto',
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-nunito)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                      Vincular formulario externo
                    </h2>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Cada respuesta del formulario registrará un asistente automáticamente en este evento.
                    </p>
                  </div>
                  <button onClick={() => setModal(null)} className="neu-btn shrink-0" style={{ padding: '6px 10px' }} aria-label="Cerrar">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>

                {/* URL del webhook + ID del evento — siempre visibles */}
                <div className="flex flex-col gap-3">
                  <CodeBlock
                    label="URL del Webhook"
                    value={webhookUrl}
                    copyKey="url"
                    copiedKey={copiedKey}
                    onCopy={copy}
                  />
                  <CodeBlock
                    label="ID de este evento (ya incluido en los snippets)"
                    value={eventId}
                    copyKey="id"
                    copiedKey={copiedKey}
                    onCopy={copy}
                    color="#f59e0b"
                  />
                </div>

                {/* Pestañas de integración */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-1 p-1 rounded-2xl" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-soft-inset)' }}>
                    <TabBtn active={webhookTab === 'apps-script'} onClick={() => setWebhookTab('apps-script')}>
                      Apps Script
                    </TabBtn>
                    <TabBtn active={webhookTab === 'zapier'} onClick={() => setWebhookTab('zapier')}>
                      Zapier
                    </TabBtn>
                    <TabBtn active={webhookTab === 'make'} onClick={() => setWebhookTab('make')}>
                      Make
                    </TabBtn>
                  </div>

                  {webhookTab === 'apps-script' && (
                    <div className="flex flex-col gap-3">
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                        La opción más directa: sin servicios externos. Ve a tu Google Form →{' '}
                        <strong style={{ color: 'var(--text-primary)' }}>Extensiones → Apps Script</strong>,
                        pega el código y ejecuta <code style={{ color: 'var(--accent)' }}>configurar</code> una vez.
                      </p>
                      <CodeBlock
                        label="Google Apps Script — listo para pegar"
                        value={appsScript}
                        copyKey="apps-script"
                        copiedKey={copiedKey}
                        onCopy={copy}
                        color="#86efac"
                      />
                    </div>
                  )}

                  {webhookTab === 'zapier' && (
                    <div className="flex flex-col gap-3">
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                        En <strong style={{ color: 'var(--text-primary)' }}>zapier.com</strong> crea un Zap con el
                        trigger de Google Forms y la acción <em>Webhooks by Zapier → POST</em>. Usa los valores de abajo:
                      </p>
                      <CodeBlock
                        label="Configuración del Zap"
                        value={zapierSteps}
                        copyKey="zapier"
                        copiedKey={copiedKey}
                        onCopy={copy}
                        color="#fde68a"
                      />
                      <CodeBlock
                        label="Payload JSON de ejemplo"
                        value={jsonPayload}
                        copyKey="json"
                        copiedKey={copiedKey}
                        onCopy={copy}
                      />
                    </div>
                  )}

                  {webhookTab === 'make' && (
                    <div className="flex flex-col gap-3">
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                        En <strong style={{ color: 'var(--text-primary)' }}>make.com</strong> crea un escenario:
                        Google Forms → HTTP › Make a request (POST). Usa el JSON de abajo como body:
                      </p>
                      <CodeBlock
                        label="Payload para Make"
                        value={makePayload}
                        copyKey="make"
                        copiedKey={copiedKey}
                        onCopy={copy}
                        color="#a5b4fc"
                      />
                    </div>
                  )}
                </div>

                <button onClick={() => setModal(null)} className="neu-btn w-full justify-center">
                  Cerrar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Modal: Añadir Manual ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {modal === 'manual' && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModal(null)}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(74,85,104,0.25)', backdropFilter: 'blur(4px)' }}
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
                      type="text" required
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
                      type="email" required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="correo@ejemplo.com"
                      className="neu-input"
                    />
                  </div>

                  <div className="flex gap-3 mt-2">
                    <button type="button" onClick={() => setModal(null)} className="neu-btn flex-1 justify-center">
                      Cancelar
                    </button>
                    <button
                      type="submit" disabled={isPending}
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
