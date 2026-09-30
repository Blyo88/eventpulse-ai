'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { Tables } from '@/types/supabase'
import AttendeeList from './attendee-list'
import IncidentList from './incident-list'
import PhotoGallery from './photo-gallery'

interface EventTabsProps {
  eventId: string
  attendees: Tables<'attendees'>[]
  incidents: Tables<'incidents'>[]
  photos: Tables<'photos'>[]
  openIncidents: number
}

export default function EventTabs({
  eventId,
  attendees,
  incidents,
  photos,
  openIncidents,
}: EventTabsProps) {
  return (
    <Tabs defaultValue="attendees">
      <div
        className="rounded-full inline-flex gap-1 p-1"
        style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-soft-inset)' }}
      >
        <TabsList
          className="bg-transparent gap-1 rounded-full"
          style={{ background: 'transparent' }}
        >
          <TabsTrigger
            value="attendees"
            className="rounded-full px-5 py-2 text-sm font-semibold transition-all"
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
            className="rounded-full px-5 py-2 text-sm font-semibold transition-all"
            style={{ background: 'transparent', border: 'none' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <path d="M12 9v4M12 17h.01" />
            </svg>
            Incidentes ({incidents.length})
            {openIncidents > 0 && (
              <span
                className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '0.65rem' }}
              >
                {openIncidents}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="gallery"
            className="rounded-full px-5 py-2 text-sm font-semibold transition-all"
            style={{ background: 'transparent', border: 'none' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
            Galería ({photos.length})
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="attendees" className="mt-4">
        <AttendeeList attendees={attendees} />
      </TabsContent>

      <TabsContent value="incidents" className="mt-4">
        <IncidentList eventId={eventId} incidents={incidents} />
      </TabsContent>

      <TabsContent value="gallery" className="mt-4">
        <PhotoGallery eventId={eventId} initialPhotos={photos} />
      </TabsContent>
    </Tabs>
  )
}
