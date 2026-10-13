'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import SpotlightCard from '@/app/components/spotlight-card'
import { CollaboratorDrawer } from '@/app/components/collaborator-drawer'

const ROLE_COLORS: Record<string, { bg: string, text: string }> = {
  owner: { bg: 'rgba(155, 114, 207, 0.2)', text: '#9b72cf' },
  admin: { bg: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b' },
  editor: { bg: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6' },
  spectator: { bg: 'rgba(107, 114, 128, 0.2)', text: '#6b7280' },
}

export default function WorkspaceContent({ org, members, orgId, userEmail }: any) {
  const [activeTab, setActiveTab] = useState<'team' | 'account'>('team')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null)

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMsg('¡Contraseña actualizada correctamente!')
    setTimeout(() => setPasswordMsg(null), 3000)
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: 'var(--font-nunito)', fontWeight: 800, fontSize: '1.8rem', color: 'var(--text-primary)' }}>
            Configuración del Sistema
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 2 }}>
            Gestiona tu perfil personal y los colaboradores de tu espacio de trabajo.
          </p>
        </div>
        {activeTab === 'team' && (
          <button 
            className="neu-btn-primary px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg" 
            onClick={() => setIsDrawerOpen(true)}
          >
            <span>+</span> Invitar Colaborador
          </button>
        )}
      </motion.div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('team')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
            activeTab === 'team' 
              ? 'shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.05)] text-[var(--accent)] bg-[var(--surface)]' 
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          Equipo y Espacio de Trabajo ({org.name})
        </button>

        <button
          onClick={() => setActiveTab('account')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
            activeTab === 'account' 
              ? 'shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.05)] text-[var(--accent)] bg-[var(--surface)]' 
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          Perfil / Cuenta Personal
        </button>
      </div>

      {/* Tab Content: Team */}
      {activeTab === 'team' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-nunito)' }}>
              Miembros del Equipo ({members.length})
            </h2>
          </div>

          <div className="grid gap-3">
            {members.map((member: any) => {
              const roleInfo = ROLE_COLORS[member.role] || ROLE_COLORS.spectator
              return (
                <SpotlightCard key={member.id} className="neu-card flex items-center justify-between p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-soft-inset)', color: 'var(--accent)' }}>
                      {member.user_id ? member.user_id.substring(0, 2).toUpperCase() : 'US'}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                        ID de Usuario: {member.user_id}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Miembro desde {new Date(member.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="neu-badge uppercase px-3 py-1 rounded-full text-xs font-bold tracking-wider" style={{ background: roleInfo.bg, color: roleInfo.text }}>
                    {member.role}
                  </span>
                </SpotlightCard>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Tab Content: Account */}
      {activeTab === 'account' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-2xl">
          <SpotlightCard className="neu-card p-6 flex flex-col gap-6 rounded-3xl">
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-nunito)' }}>
                Información de Cuenta
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Detalles de tu sesión actual en EventPulse AI
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Correo Electrónico Registrado
              </label>
              <input 
                type="email" 
                value={userEmail || 'usuario@eventpulse.ai'} 
                disabled 
                className="neu-input px-4 py-3 rounded-xl w-full opacity-70 cursor-not-allowed" 
              />
            </div>

            <form onSubmit={handlePasswordUpdate} className="flex flex-col gap-4 pt-4 border-t border-white/10">
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Actualizar Contraseña
              </h3>

              {passwordMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                  {passwordMsg}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Nueva Contraseña
                </label>
                <input 
                  type="password" 
                  placeholder="••••••••••••" 
                  className="neu-input px-4 py-3 rounded-xl w-full outline-none" 
                  required 
                />
              </div>

              <button type="submit" className="neu-btn-primary py-3 rounded-xl font-bold mt-2">
                Guardar Cambios
              </button>
            </form>
          </SpotlightCard>
        </motion.div>
      )}

      <CollaboratorDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        orgId={orgId} 
        onInviteSuccess={() => window.location.reload()} 
      />
    </div>
  )
}
