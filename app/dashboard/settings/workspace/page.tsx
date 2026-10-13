import { organizationService } from '@/lib/services/organization.service'
import { createClient } from '@/lib/supabase/server'
import WorkspaceContent from './WorkspaceContent'

const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000000'

export default async function WorkspaceSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [org, members] = await Promise.all([
    organizationService.getOrganization(DEMO_ORG_ID),
    organizationService.getMembers(DEMO_ORG_ID),
  ])

  if (!org) return <div className="p-8 text-slate-300">Organización no encontrada.</div>

  return (
    <WorkspaceContent 
      org={org} 
      members={members} 
      orgId={DEMO_ORG_ID} 
      userEmail={user?.email || ''} 
    />
  )
}
