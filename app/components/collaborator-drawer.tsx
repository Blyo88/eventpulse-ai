'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import InviteMemberModal from '@/app/components/modals/InviteMemberModal' // Reutilizamos lógica si es necesario

// Este es el drawer que gestionará el flujo de invitación
export function CollaboratorDrawer({ isOpen, onClose, orgId, onInviteSuccess }: any) {
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
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
          
          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-screen w-80 z-50 neu-card flex flex-col p-6"
            style={{ 
                background: 'var(--surface)', 
                borderRadius: '0 24px 24px 0',
                borderRight: '1px solid var(--glass-border)' 
            }}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-100">Gestionar Equipo</h2>
              <button onClick={onClose} className="p-2 rounded-full neu-btn">
                ✕
              </button>
            </div>

            {/* Aquí iría el formulario de invitación */}
            <div className="flex-1">
                {/* Por ahora, dejamos un placeholder indicando el formulario */}
                <p className="text-slate-400 text-sm">Formulario de invitación aquí...</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}