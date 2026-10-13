'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { inviteMemberSchema } from '@/lib/validations/organization'
import { inviteMemberAction } from '@/lib/actions/organization'

export function CollaboratorDrawer({ isOpen, onClose, orgId, onInviteSuccess }: any) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'editor' | 'spectator'>('spectator')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    
    const result = inviteMemberSchema.safeParse({ email, role })
    if (!result.success) {
      setError('Correo electrónico inválido')
      return
    }

    startTransition(async () => {
      const response = await inviteMemberAction({ ...result.data, orgId })
      if (!response.success) {
        setError(response.message)
      } else {
        setSuccessMsg(response.message)
        setEmail('')
        setTimeout(() => {
          onInviteSuccess?.(response.message)
          onClose()
        }, 1200)
      }
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md"
          />
          
          {/* Drawer Panel (Left slide) */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed left-0 top-0 h-screen w-96 z-50 flex flex-col p-6 shadow-2xl"
            style={{ 
              background: 'var(--surface)', 
              borderRadius: '0 28px 28px 0',
              borderRight: '1px solid var(--glass-border)',
              boxShadow: 'var(--shadow-soft-raised)'
            }}
          >
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-nunito)' }}>
                  Invitar Colaborador
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Añade un nuevo miembro a tu espacio de trabajo
                </p>
              </div>
              <button onClick={onClose} className="neu-btn p-2 rounded-full" aria-label="Cerrar">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                  {successMsg}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Correo electrónico
                </label>
                <input 
                  type="email" 
                  placeholder="colaborador@institucion.com" 
                  className="neu-input px-4 py-3 rounded-xl w-full outline-none"
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  disabled={isPending} 
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Rol en la Organización
                </label>
                <select 
                  className="neu-input px-4 py-3 rounded-xl w-full outline-none cursor-pointer"
                  value={role} 
                  onChange={e => setRole(e.target.value as any)} 
                  disabled={isPending}
                >
                  <option value="admin">Administrador (Control total)</option>
                  <option value="editor">Editor (Gestión de eventos)</option>
                  <option value="spectator">Espectador (Sólo lectura)</option>
                </select>
              </div>

              <div className="mt-auto pt-4 flex flex-col gap-3">
                <button 
                  type="submit" 
                  className="neu-btn-primary w-full py-3 rounded-xl flex items-center justify-center font-bold shadow-md"
                  disabled={isPending}
                >
                  {isPending ? 'Enviando invitación...' : 'Enviar Invitación'}
                </button>
                <button 
                  type="button" 
                  onClick={onClose}
                  className="neu-btn w-full py-2.5 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
