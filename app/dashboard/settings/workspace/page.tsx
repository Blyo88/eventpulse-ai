import { organizationService } from '@/lib/services/organization.service'
import WorkspaceContent from './WorkspaceContent'

// Provisional DEMO ID
const DEMO_ORG_ID = 'demo-org-id'

export default async function WorkspaceSettingsPage() {
  const org = await organizationService.getOrganization(DEMO_ORG_ID)
  const members = await organizationService.getMembers(DEMO_ORG_ID)

  if (!org) return <div>Organización no encontrada.</div>

  return <WorkspaceContent org={org} members={members} orgId={DEMO_ORG_ID} />
}