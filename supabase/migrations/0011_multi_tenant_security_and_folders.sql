-- EventPulse AI — Multi-tenant hardening and custom photo folders
-- Apply this migration in Supabase before deploying the multi-user release.

-- Custom user-created folder names are stored in photos.category.
ALTER TABLE public.photos DROP CONSTRAINT IF EXISTS photos_category_check;

-- RLS for tenant tables. Policies use the organization membership as source of truth.
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "organizations_members_can_read" ON public.organizations;
CREATE POLICY "organizations_members_can_read" ON public.organizations
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "organization_members_can_read_own_org" ON public.organization_members;
CREATE POLICY "organization_members_can_read_own_org" ON public.organization_members
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "events_org_members" ON public.events;
CREATE POLICY "events_org_members" ON public.events
  FOR ALL TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "attendees_org_members" ON public.attendees;
CREATE POLICY "attendees_org_members" ON public.attendees
  FOR ALL TO authenticated
  USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    event_id IN (
      SELECT id FROM public.events
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "incidents_org_members" ON public.incidents;
CREATE POLICY "incidents_org_members" ON public.incidents
  FOR ALL TO authenticated
  USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    event_id IN (
      SELECT id FROM public.events
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "photos_org_members" ON public.photos;
CREATE POLICY "photos_org_members" ON public.photos
  FOR ALL TO authenticated
  USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    event_id IN (
      SELECT id FROM public.events
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "ai_analyses_org_members" ON public.ai_analyses;
CREATE POLICY "ai_analyses_org_members" ON public.ai_analyses
  FOR ALL TO authenticated
  USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    event_id IN (
      SELECT id FROM public.events
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
      )
    )
  );

NOTIFY pgrst, 'reload schema';
