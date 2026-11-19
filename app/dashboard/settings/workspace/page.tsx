import { organizationService } from '@/lib/services/organization.service'
import { getAuthUser } from '@/lib/auth/get-user'
import WorkspaceContent from './WorkspaceContent'
import CreateWorkspaceForm from './CreateWorkspaceForm'

export default async function WorkspaceSettingsPage() {
  const { userId, organizationId, user } = await getAuthUser()

  if (!organizationId) {
    return <CreateWorkspaceForm userEmail={user?.email || ''} />
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
