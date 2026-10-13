import { z } from 'zod'

export const inviteMemberSchema = z.object({
  email: z.string().email('Correo electrónico no válido'),
  role: z.enum(['admin', 'editor', 'spectator']),
})

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>