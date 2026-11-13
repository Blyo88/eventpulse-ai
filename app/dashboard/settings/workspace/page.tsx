import { organizationService } from '@/lib/services/organization.service'
import { getAuthUser } from '@/lib/auth/get-user'
import WorkspaceContent from './WorkspaceContent'

export default async function WorkspaceSettingsPage() {
  const { userId, organizationId, user } = await getAuthUser()

  if (!organizationId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          No tienes una organización configurada aún.
        </p>
      </div>
    )
  }

  const [org, members] = await Promise.all([
    organizationService.getOrganization(organizationId),
    organizationService.getMembers(organizationId),
  ])

  if (!org) return <div className="p-8" style={{ color: 'var(--text-muted)' }}>Organización no encontrada.</div>

  return (
    <WorkspaceContent 
      org={org} 
      members={members} 
      orgId={organizationId}
      userEmail={user?.email || ''}
    />
  )
}
