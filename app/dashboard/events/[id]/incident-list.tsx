'use client'

import type { Tables } from '@/types/supabase'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import ResolveIncidentModal from '../../incidents/resolve-modal'

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Baja', color: '#9b72cf', bgColor: 'rgba(155, 114, 207, 0.1)' },
  medium: { label: 'Media', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
  high: { label: 'Alta', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' },
  critical: { label: 'Crítica', color: '#dc2626', bgColor: 'rgba(220, 38, 38, 0.15)' },
}

const CATEGORY_CONFIG: Record<string, string> = {
  logistics: 'Logística',
  capacity: 'Capacidad',
  hardware: 'Hardware',
  software: 'Software',
  other: 'Otro',
}

export default function IncidentList({
  eventId,
  incidents,
}: {
  eventId: string
  incidents: Tables<'incidents'>[]
}) {
  if (incidents.length === 0) {
    return (
      <div className="neu-card flex flex-col items-center py-14 gap-3">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
             stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Sin incidentes para este evento. ¡Todo va bien!
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {incidents.map((incident) => {
        const severity = SEVERITY_CONFIG[incident.severity] || SEVERITY_CONFIG.low
        const category = CATEGORY_CONFIG[incident.category] || 'Otro'
        const fecha = new Date(incident.created_at).toLocaleDateString('es-ES', {
          day: 'numeric', month: 'short', year: 'numeric',
        })
        const hora = new Date(incident.created_at).toLocaleTimeString('es-ES', {
          hour: '2-digit', minute: '2-digit',
        })

        return (
          <article 
            key={incident.id} 
            className="neu-card flex flex-col gap-3 transition-opacity duration-300"
            style={{ opacity: incident.resolved ? 0.75 : 1 }}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="neu-badge" style={{ background: severity.bgColor, color: severity.color }}>
                {severity.label}
              </span>
              <span className="neu-badge" style={{ background: 'var(--surface-deep)', color: 'var(--text-muted)' }}>
                {category}
              </span>
              {incident.resolved ? (
                <span className="neu-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                  ✓ Resuelto
                </span>
              ) : (
                <ResolveIncidentModal
                  incidentId={incident.id}
                  trigger={
                    <button className="neu-badge cursor-pointer hover:opacity-80 transition-opacity" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', font: 'inherit' }}>
                      Pendiente (Resolver)
                    </button>
                  }
                />
              )}
            </div>
            
            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {incident.description}
            </p>

            {/* Resolución Note */}
            {incident.resolved && incident.resolution_note && (
              <div 
                className="mt-2 p-3 rounded-xl"
                style={{ background: 'var(--surface-deep)', boxShadow: 'var(--shadow-soft-inset)' }}
              >
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                  Nota de solución:
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.4 }}>
                  &quot;{incident.resolution_note}&quot;
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 mt-auto" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              {fecha} · {hora}
            </div>
          </article>
        )
      })}
    </div>
  )
}
