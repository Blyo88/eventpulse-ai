'use client'

import { useState } from 'react'
import type { Tables } from '@/types/supabase'
import ResolveIncidentModal from './resolve-modal'
import SpotlightCard from '@/app/components/spotlight-card'

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Baja', color: '#9b72cf', bgColor: 'rgba(155, 114, 207, 0.1)' },
  medium: { label: 'Media', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
  high: { label: 'Alta', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' },
  critical: { label: 'Crítica', color: '#dc2626', bgColor: 'rgba(220, 38, 38, 0.15)' },
}

const CATEGORY_CONFIG: Record<string, { label: string }> = {
  logistics: { label: 'Logística' },
  capacity: { label: 'Capacidad' },
  hardware: { label: 'Hardware' },
  software: { label: 'Software' },
  other: { label: 'Otro' },
}

interface IncidentsTableClientProps {
  events: Tables<'events'>[]
  incidents: Tables<'incidents'>[]
}

export default function IncidentsTableClient({ events, incidents }: IncidentsTableClientProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const eventMap = new Map(events.map((e) => [e.id, e]))

  const filteredIncidents = incidents.filter((incident) => {
    if (selectedEventId !== 'all' && incident.event_id !== selectedEventId) {
      return false
    }
    if (selectedStatus === 'open' && incident.resolved) return false
    if (selectedStatus === 'resolved' && !incident.resolved) return false
    return true
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-[var(--surface)] p-4 rounded-2xl shadow-[var(--shadow-soft-inset)]">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Evento:
          </span>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="neu-input px-3 py-2 rounded-xl text-sm flex-1 outline-none cursor-pointer"
          >
            <option value="all">Todos los eventos ({events.length})</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 min-w-[200px]">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Estado:
          </span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="neu-input px-3 py-2 rounded-xl text-sm flex-1 outline-none cursor-pointer"
          >
            <option value="all">Todos los estados</option>
            <option value="open">⏳ Pendientes</option>
            <option value="resolved">✓ Resueltos</option>
          </select>
        </div>
      </div>

      {/* Chronological Table */}
      {filteredIncidents.length === 0 ? (
        <SpotlightCard className="neu-card flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2" style={{ boxShadow: 'var(--shadow-soft-inset)', background: 'var(--surface)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <path d="M12 9v4M12 17h.01" />
            </svg>
          </div>
          <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
            No se encontraron incidentes con los filtros seleccionados
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Prueba cambiando el evento o el estado para ver más registros.
          </p>
        </SpotlightCard>
      ) : (
        <div className="neu-card overflow-x-auto rounded-2xl p-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th className="py-3 px-4 font-bold">Fecha y Hora</th>
                <th className="py-3 px-4 font-bold">Evento</th>
                <th className="py-3 px-4 font-bold">Incidente / Descripción</th>
                <th className="py-3 px-4 font-bold">Gravedad</th>
                <th className="py-3 px-4 font-bold">Estado</th>
                <th className="py-3 px-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredIncidents.map((incident) => {
                const event = eventMap.get(incident.event_id)
                const severity = SEVERITY_CONFIG[incident.severity] || SEVERITY_CONFIG.low
                const category = CATEGORY_CONFIG[incident.category] || CATEGORY_CONFIG.other
                const fecha = new Date(incident.created_at).toLocaleDateString('es-ES', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })
                const hora = new Date(incident.created_at).toLocaleTimeString('es-ES', {
                  hour: '2-digit', minute: '2-digit',
                })

                return (
                  <tr key={incident.id} className="hover:bg-white/[0.02] transition-colors" style={{ opacity: incident.resolved ? 0.8 : 1 }}>
                    <td className="py-4 px-4 text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                      <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{fecha}</div>
                      <div>{hora}</div>
                    </td>
                    <td className="py-4 px-4 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {event?.title || 'Evento desconocido'}
                    </td>
                    <td className="py-4 px-4 max-w-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="neu-badge text-[10px] px-2 py-0.5" style={{ background: 'var(--surface-deep)', color: 'var(--text-muted)' }}>
                          {category.label}
                        </span>
                      </div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        {incident.description}
                      </p>
                      {incident.resolved && incident.resolution_note && (
                        <div className="mt-2 p-2.5 rounded-xl text-xs" style={{ background: 'var(--surface-deep)', boxShadow: 'var(--shadow-soft-inset)' }}>
                          <span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            Solución:
                          </span>
                          <p className="italic mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            &quot;{incident.resolution_note}&quot;
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="neu-badge px-2.5 py-1 text-xs font-bold rounded-full" style={{ background: severity.bgColor, color: severity.color }}>
                        {severity.label}
                      </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      {incident.resolved ? (
                        <span className="neu-badge px-2.5 py-1 text-xs font-bold rounded-full" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                          ✓ Resuelto
                        </span>
                      ) : (
                        <span className="neu-badge px-2.5 py-1 text-xs font-bold rounded-full" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                          ⏳ Pendiente
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      {!incident.resolved && (
                        <ResolveIncidentModal
                          incidentId={incident.id}
                          trigger={
                            <button
                              className="neu-btn text-xs px-3 py-1.5 font-bold spring-interactive"
                              style={{
                                background: 'var(--glass-bg)',
                                backdropFilter: 'blur(8px)',
                                border: '1px solid var(--glass-border)',
                                color: 'var(--text-primary)',
                              }}
                            >
                              Resolver
                            </button>
                          }
                        />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
