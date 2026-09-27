import { z } from 'zod'

// Event Schemas
export const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(1000).nullable().optional(),
  date: z.string().datetime('Invalid date format'),
  location: z.string().max(255).nullable().optional(),
  capacity: z.number().int().min(0, 'Capacity must be positive').default(0),
})

export const eventUpdateSchema = createEventSchema.partial()

export type CreateEventInput = z.infer<typeof createEventSchema>
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>

// Attendee Schemas
export const registerAttendeeSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
  full_name: z.string().min(1, 'Full name is required').max(255),
  email: z.string().email('Invalid email format'),
  registered_via: z.string().default('webhook'),
})

export const checkInAttendeeSchema = z.object({
  attendee_id: z.string().uuid('Invalid attendee ID'),
  event_id: z.string().uuid('Invalid event ID'),
})

export type RegisterAttendeeInput = z.infer<typeof registerAttendeeSchema>
export type CheckInAttendeeInput = z.infer<typeof checkInAttendeeSchema>

// Webhook Form Payload (Google Forms, Typeform, etc.)
export const webhookFormPayloadSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
  full_name: z.string().min(1).max(255),
  email: z.string().email(),
})

export type WebhookFormPayload = z.infer<typeof webhookFormPayloadSchema>

// Error Response Schema
export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  code: z.string().optional(),
})

export type ErrorResponse = z.infer<typeof errorResponseSchema>

// Success Response Schema
export const successResponseSchema = z.object({
  success: z.boolean().default(true),
  data: z.unknown().optional(),
  message: z.string().optional(),
})

export type SuccessResponse = z.infer<typeof successResponseSchema>
