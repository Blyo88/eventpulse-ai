'use client'

import { useActionState } from 'react'
import { registerAction, type RegisterState } from '@/lib/actions/register'
import { motion } from 'framer-motion'
import Link from 'next/link'

const initialState: RegisterState = { error: null }

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, initialState)

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--surface)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        className="w-full max-w-sm"
      >
        {/* Logo / Heading */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full"
               style={{ boxShadow: 'var(--shadow-soft-raised)', background: 'var(--surface)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                 stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <h1 style={{ fontFamily: 'var(--font-nunito)', fontWeight: 800, fontSize: '1.75rem', color: 'var(--text-primary)' }}>
            Crear cuenta
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            Regístrate en EventPulse AI
          </p>
        </div>

        {/* Card */}
        <div className="neu-card" style={{ padding: '32px' }}>
          <form action={formAction} noValidate>
            {/* Error global */}
            {state.error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-5 p-3 rounded-xl text-sm text-center"
                style={{
                  background: 'rgba(240, 113, 103, 0.12)',
                  color: '#e53e3e',
                  borderRadius: 'var(--r-md)',
                }}
              >
                {state.error}
              </motion.div>
            )}

            {/* Campo Email */}
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block mb-2"
                style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="tu@email.com"
                className="neu-input"
                aria-describedby={state.fieldErrors?.email ? 'email-error' : undefined}
              />
              {state.fieldErrors?.email && (
                <p id="email-error" className="mt-1 text-xs" style={{ color: '#e53e3e' }}>
                  {state.fieldErrors.email[0]}
                </p>
              )}
            </div>

            {/* Campo Contraseña */}
            <div className="mb-4">
              <label
                htmlFor="password"
                className="block mb-2"
                style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="Mínimo 6 caracteres"
                className="neu-input"
                aria-describedby={state.fieldErrors?.password ? 'pass-error' : undefined}
              />
              {state.fieldErrors?.password && (
                <p id="pass-error" className="mt-1 text-xs" style={{ color: '#e53e3e' }}>
                  {state.fieldErrors.password[0]}
                </p>
              )}
            </div>

            {/* Confirmar Contraseña */}
            <div className="mb-6">
              <label
                htmlFor="confirmPassword"
                className="block mb-2"
                style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}
              >
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                placeholder="Repite tu contraseña"
                className="neu-input"
                aria-describedby={state.fieldErrors?.confirmPassword ? 'confirm-error' : undefined}
              />
              {state.fieldErrors?.confirmPassword && (
                <p id="confirm-error" className="mt-1 text-xs" style={{ color: '#e53e3e' }}>
                  {state.fieldErrors.confirmPassword[0]}
                </p>
              )}
            </div>

            {/* Botón primario */}
            <button
              type="submit"
              disabled={pending}
              className="neu-btn-primary w-full justify-center"
              style={{ opacity: pending ? 0.7 : 1 }}
            >
              {pending ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                       className="animate-spin">
                    <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" strokeOpacity=".3"/>
                    <path d="M12 3a9 9 0 0 1 9 9"/>
                  </svg>
                  Creando cuenta…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <path d="M20 8v6M23 11h-6"/>
                  </svg>
                  Crear cuenta
                </>
              )}
            </button>
          </form>

          {/* Enlace a login */}
          <p className="text-center mt-6" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
              Iniciar sesión
            </Link>
          </p>
        </div>

        <p className="text-center mt-6" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          EventPulse AI © 2026 — Plataforma B2B de gestión de eventos
        </p>
      </motion.div>
    </div>
  )
}