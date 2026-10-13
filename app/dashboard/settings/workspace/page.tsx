import { organizationService } from '@/lib/services/organization.service'
import SpotlightCard from '@/app/components/spotlight-card'
import { motion } from 'framer-motion'

// Provisional DEMO ID
const DEMO_ORG_ID = 'demo-org-id'

const ROLE_COLORS: Record<string, { bg: string, text: string }> = {
  owner: { bg: 'rgba(155, 114, 207, 0.2)', text: '#9b72cf' },
  admin: { bg: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b' },
  editor: { bg: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6' },
  spectator: { bg: 'rgba(107, 114, 128, 0.2)', text: '#6b7280' },
}

export default async function WorkspaceSettingsPage() {
  const org = await organizationService.getOrganization(DEMO_ORG_ID)
  const members = await organizationService.getMembers(DEMO_ORG_ID)

  if (!org) return <div>Organización no encontrada.</div>

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 style={{ fontFamily: 'var(--font-nunito)', fontWeight: 800, fontSize: '1.8rem', color: 'var(--text-primary)' }}>
            Configuración del Espacio: {org.name}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
            Gestiona tu equipo y accesos al capítulo.
          </p>
        </div>
        
        <button 
          className="neu-btn-primary"
          onClick={() => console.log("Abrir modal de invitación")}
        >
          Invitar Colaborador
        </button>
      </motion.div>

      <div className="grid gap-4">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Miembros del equipo</h2>
        {members.map((member) => (
          <motion.div
            key={member.id}
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <SpotlightCard className="neu-card flex items-center justify-between p-4">
              <div>
                <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Usuario: {member.user_id.slice(0, 8)}...</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Ingresó: {new Date(member.created_at).toLocaleDateString()}
                </p>
              </div>
              <span 
                className="neu-badge lowercase" 
                style={{ 
                  background: ROLE_COLORS[member.role].bg,
                  color: ROLE_COLORS[member.role].text
                }}
              >
                {member.role}
              </span>
            </SpotlightCard>
          </motion.div>
        ))}
      </div>
    </div>
  )
}