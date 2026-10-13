'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import SpotlightCard from '@/app/components/spotlight-card'
import InviteMemberModal from '@/app/components/modals/InviteMemberModal'

const ROLE_COLORS: Record<string, { bg: string, text: string }> = {
  owner: { bg: 'rgba(155, 114, 207, 0.2)', text: '#9b72cf' },
  admin: { bg: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b' },
  editor: { bg: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6' },
  spectator: { bg: 'rgba(107, 114, 128, 0.2)', text: '#6b7280' },
}

export default function WorkspaceContent({ org, members, orgId }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: 'var(--font-nunito)', fontWeight: 800, fontSize: '1.8rem', color: 'var(--text-primary)' }}>
            Configuración del Espacio: {org.name}
          </h1>
        </div>
        <button className="neu-btn-primary" onClick={() => setIsModalOpen(true)}>Invitar Colaborador</button>
      </motion.div>

      <div className="grid gap-4">
        {members.map((member: any) => (
          <SpotlightCard key={member.id} className="neu-card flex items-center justify-between p-4">
            <p style={{ color: 'var(--text-primary)' }}>{member.user_id}</p>
            <span className="neu-badge lowercase" style={{ background: ROLE_COLORS[member.role].bg, color: ROLE_COLORS[member.role].text }}>{member.role}</span>
          </SpotlightCard>
        ))}
      </div>
      <InviteMemberModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} orgId={orgId} onInviteSuccess={() => window.location.reload()} />
    </div>
  )
}