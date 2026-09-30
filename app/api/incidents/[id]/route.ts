import { NextRequest, NextResponse } from 'next/server'
import { incidentService } from '@/lib/services/incident.service'
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
    const { id } = await params
    const body = await request.json()
    
    // Validación de Zod
    const parsed = resolveSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validación fallida', issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { resolution_note } = parsed.data
    const incident = await incidentService.resolveIncident(id, resolution_note)
    
    return NextResponse.json({ data: incident }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
