'use server'

import { incidentService } from '@/lib/services/incident.service'
import { assertIncidentAccess, getAuthUser } from '@/lib/auth/get-user'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const resolveSchema = z.object({
  incidentId: z.string().uuid('ID de incidente inválido'),
  resolutionNote: z.string().optional(),
})

export async function resolveIncidentAction(incidentId: string, resolutionNote?: string) {
  try {
    const validated = resolveSchema.safeParse({ incidentId, resolutionNote })
    if (!validated.success) {
      return { success: false, error: 'Datos inválidos' }
    }

    const { organizationId } = await getAuthUser()
    if (!organizationId) {
      return { success: false, error: 'No tienes una organización asignada' }
    }

    // Verificar que el incidente pertenezca a la organización
    await assertIncidentAccess(incidentId, organizationId)

    // Resolver incidente
    await incidentService.resolveIncident(incidentId, resolutionNote)

    revalidatePath('/dashboard/incidents')
    revalidatePath('/dashboard/events')

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al resolver incidente'
    return { success: false, error: message }
  }
}
