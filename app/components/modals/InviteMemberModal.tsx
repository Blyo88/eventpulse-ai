'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { inviteMemberSchema } from '@/lib/validations/organization'
import { inviteMemberAction } from '@/lib/actions/organization'

export default function InviteMemberModal({ isOpen, onClose, orgId, onInviteSuccess }: any) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'editor' | 'spectator'>('spectator')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // Validar con Zod
    const result = inviteMemberSchema.safeParse({ email, role })
    if (!result.success) {
      setError('Correo inválido')
      return
    }

    startTransition(async () => {
      const response = await inviteMemberAction({ ...result.data, orgId })
      if (!response.success) {
        setError(response.message)
      } else {
        onInviteSuccess(response.message)
        onClose()
      }
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="neu-card w-full max-w-sm p-6 flex flex-col gap-4">
              <h2 className="text-lg font-bold text-slate-100">Invitar Colaborador</h2>
              
              {error && <p className="text-red-500 text-sm">{error}</p>}
              
              <input type="email" placeholder="Correo" className="neu-input" value={email} onChange={e => setEmail(e.target.value)} disabled={isPending} />
              
              <select className="neu-input" value={role} onChange={e => setRole(e.target.value as any)} disabled={isPending}>
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="spectator">Spectator</option>
              </select>
              
              <button type="submit" className="neu-btn-primary" disabled={isPending}>
                {isPending ? 'Enviando...' : 'Enviar Invitación'}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}