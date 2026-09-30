'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { Tables } from '@/types/supabase'
import AttendeeList from './attendee-list'
import IncidentList from './incident-list'

interface EventTabsProps {
  eventId: string
  attendees: Tables<'attendees'>[]
  incidents: Tables<'incidents'>[]
}

export default function EventTabs({
  eventId,
  attendees,
  incidents,
}: EventTabsProps) {
  return (
    <Tabs defaultValue="attendees">
      <div
        className="rounded-full inline-flex gap-1 p-1 flex-wrap"
        style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-soft-inset)' }}
      >
        <TabsList
          className="bg-transparent gap-1 rounded-full flex-wrap"
          style={{ background: 'transparent' }}
        >
          <TabsTrigger
            value="attendees"
            className="rounded-full px-5 py-2 text-sm font-semibold transition-all whitespace-nowrap"
            style={{ background: 'transparent', border: 'none' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            </svg>
            Asistentes ({attendees.length})
          </TabsTrigger>
          <TabsTrigger
            value="incidents"
            className="rounded-full px-5 py-2 text-sm font-semibold transition-all whitespace-nowrap"
            style={{ background: 'transparent', border: 'none' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <path d="M12 9v4M12 17h.01" />
            </svg>
            Incidentes ({incidents.length})
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="attendees" className="mt-4">
        <AttendeeList eventId={eventId} attendees={attendees} />
      </TabsContent>

      <TabsContent value="incidents" className="mt-4">
        <IncidentList eventId={eventId} incidents={incidents} />
      </TabsContent>
    </Tabs>
  )
}
