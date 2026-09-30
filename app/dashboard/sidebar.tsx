'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTransition, useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { logoutAction } from '@/lib/actions/auth'
import { motion } from 'framer-motion'

interface SidebarProps {
  userEmail: string
}

const navItems = [
  {
    href: '/dashboard/events',
    label: 'Eventos',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    href: '/dashboard/incidents',
    label: 'Incidentes',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <path d="M12 9v4M12 17h.01" />
      </svg>
    ),
  },
]

export default function DashboardSidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  function handleLogout() {
    startTransition(() => {
      logoutAction()
    })
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <aside
      className="w-64 shrink-0 p-5 flex flex-col gap-4"
      style={{ background: 'var(--surface)' }}
    >
      {/* Logo */}
      <div className="neu-card flex items-center gap-3 mb-2" style={{ padding: '16px 20px' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
             stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        <div>
          <p style={{ fontFamily: 'var(--font-nunito)', fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.2 }}>
            EventPulse
          </p>
          <p style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>AI</p>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-3 px-4 py-3 rounded-full cursor-pointer transition-colors"
                style={{
                  background: 'var(--surface)',
                  boxShadow: isActive
                    ? 'var(--shadow-soft-inset)'
                    : 'var(--shadow-soft-raised)',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-nunito)',
                }}
              >
                <span style={{ opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>
                {item.label}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* Theme Toggle */}
      {mounted && (
        <button
          onClick={toggleTheme}
          className="neu-theme-toggle"
          aria-label={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
          title={`Modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
        >
          {theme === 'dark' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      )}

      {/* User & Logout */}
      <div className="neu-card" style={{ padding: '14px 16px' }}>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
          Sesión activa
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', wordBreak: 'break-all', marginBottom: 12 }}>
          {userEmail}
        </p>
        <button
          onClick={handleLogout}
          disabled={isPending}
          className="neu-btn w-full justify-center"
          style={{ fontSize: '0.8rem', padding: '8px 16px', opacity: isPending ? 0.6 : 1 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          {isPending ? 'Cerrando…' : 'Cerrar sesión'}
        </button>
      </div>
    </aside>
  )
}
