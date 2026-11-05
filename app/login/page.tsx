'use client'

import { useActionState, useState } from 'react'
import { loginAction, type LoginState } from '@/lib/actions/auth'
import { motion } from 'framer-motion'
import Link from 'next/link'

const initialState: LoginState = { error: null }

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState)
  const [showPassword, setShowPassword] = useState(false)

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
            {/* SVG inline — SKILL: thin outline, no fill, no container */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                 stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <h1 style={{ fontFamily: 'var(--font-nunito)', fontWeight: 800, fontSize: '1.75rem', color: 'var(--text-primary)' }}>
            EventPulse AI
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            Accede a tu panel de organizador
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
            <div className="mb-5">
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
            <div className="mb-7">
              <label
                htmlFor="password"
                className="block mb-2"
                style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="neu-input w-full"
                  style={{ paddingRight: '3rem' }}
                  aria-describedby={state.fieldErrors?.password ? 'pass-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all duration-200"
                  style={{ color: 'var(--text-muted)', background: 'transparent' }}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {state.fieldErrors?.password && (
                <p id="pass-error" className="mt-1 text-xs" style={{ color: '#e53e3e' }}>
                  {state.fieldErrors.password[0]}
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
                  Accediendo…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>
                  </svg>
                  Entrar
                </>
              )}
            </button>
          </form>

          {/* Enlace a registro */}
          <p className="text-center mt-6" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            ¿No tienes cuenta?{' '}
            <Link href="/register" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
              Crear una nueva
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
