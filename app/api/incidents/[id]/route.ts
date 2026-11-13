import { NextRequest, NextResponse } from 'next/server'
import { incidentService } from '@/lib/services/incident.service'
import { assertIncidentAccess, getAuthUser } from '@/lib/auth/get-user'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const resolveSchema = z.object({
  resolution_note: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await getAuthUser()
    if (!organizationId) {
      return NextResponse.json({ error: 'No tienes una organización asignada' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const parsed = resolveSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validación fallida', issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    await assertIncidentAccess(id, organizationId)
    const incident = await incidentService.resolveIncident(id, parsed.data.resolution_note)
    return NextResponse.json({ data: incident }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: message === 'No autenticado' ? 401 : 500 })
  }
}
