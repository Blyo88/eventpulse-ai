'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { Tables } from '@/types/supabase'

interface AddEventModalProps {
  events: Tables<'events'>[]
  onConfirm: (eventId: string) => void
  onClose: () => void
}

export default function AddEventModal({ events, onConfirm, onClose }: AddEventModalProps) {
  const [selected, setSelected] = useState<string>('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(74, 85, 104, 0.25)', backdropFilter: 'blur(4px)' }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
      >
        <div className="neu-card w-full max-w-sm" style={{ padding: '32px' }}>
          <h2 className="mb-6" style={{ fontFamily: 'var(--font-nunito)', fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-primary)' }}>
            Añadir evento al Estudio
          </h2>
          
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            style={{
              background: 'var(--surface)',
              border: 'none',
              borderRadius: 'var(--r-pill)',
              boxShadow: 'var(--shadow-soft-inset)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none',
              padding: '12px 20px',
              width: '100%',
              cursor: 'pointer',
              marginBottom: '24px'
            }}
          >
            <option value="">Selecciona un evento...</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>

          <div className="flex gap-3">
            <button onClick={onClose} className="neu-btn flex-1 justify-center">Cancelar</button>
            <button 
              onClick={() => {
                if (selected) {
                  onConfirm(selected)
                  // onClose()   // <--- I will remove this because AiStudioClient will close modal on confirm
                }
              }}
              disabled={!selected}
              className="neu-btn-primary flex-1 justify-center"
            >
              Confirmar
            </button>
          </div>
        </div>
      </motion.div>
    </>,
    document.body
  )
}