'use client'

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import { createWorkspaceAction } from '@/lib/actions/workspace'
import { useRouter } from 'next/navigation'

export default function CreateWorkspaceForm({ userEmail }: { userEmail: string }) {
  const defaultName = userEmail ? userEmail.split('@')[0] + ' Workspace' : 'Mi Workspace'
  const [name, setName] = useState(defaultName)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createWorkspaceAction(name.trim())
      if (!result.success) {
        setError(result.error ?? 'Error al crear el espacio de trabajo')
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        className="neu-card w-full max-w-md flex flex-col gap-6"
        style={{ padding: '36px', borderRadius: '28px' }}
      >
        {/* Icono */}
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-soft-raised)' }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                 stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-nunito)', fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-primary)' }}>
              Crea tu Espacio de Trabajo
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Necesitas un equipo para usar todas las funciones
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 rounded-2xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
            Tu espacio de trabajo es tu organización personal en EventPulse AI. Desde aquí podrás
            crear eventos, reportar incidentes y después invitar colaboradores a tu equipo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <p className="text-xs p-3 rounded-xl text-center"
               style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
              {error}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="workspace-name"
              style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}
            >
              Nombre del espacio de trabajo
            </label>
            <input
              id="workspace-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Eventos UNAL, IEEE CIS, Mi Equipo..."
              required
              minLength={2}
              maxLength={80}
              className="neu-input"
              style={{ width: '100%' }}
            />
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Puedes cambiarlo después desde la configuración.
            </p>
          </div>

          <button
            type="submit"
            disabled={isPending || name.trim().length < 2}
            className="neu-btn-primary w-full justify-center py-3 font-bold mt-2"
            style={{ opacity: isPending ? 0.7 : 1 }}
          >
            {isPending ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                     className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" strokeOpacity=".3"/>
                  <path d="M12 3a9 9 0 0 1 9 9"/>
                </svg>
                Creando equipo…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Crear Espacio de Trabajo
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
