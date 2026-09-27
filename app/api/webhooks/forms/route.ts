import { NextRequest, NextResponse } from 'next/server'
import { webhookFormPayloadSchema } from '@/lib/validations'
import { attendeeService } from '@/lib/services/attendee.service'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate webhook payload with Zod
    const validatedData = webhookFormPayloadSchema.parse(body)

    // Check if attendee already exists
    const existingAttendee = await attendeeService.getAttendeeByEmail(
      validatedData.email,
      validatedData.event_id
    )

    if (existingAttendee) {
      return NextResponse.json(
        {
          success: false,
          error: 'Attendee already registered',
          data: existingAttendee,
        },
        { status: 409 }
      )
    }

    // Register attendee via service
    const attendee = await attendeeService.registerAttendee({
      event_id: validatedData.event_id,
      full_name: validatedData.full_name,
      email: validatedData.email,
      registered_via: 'webhook',
    })

    return NextResponse.json(
      {
        success: true,
        data: attendee,
        message: 'Attendee registered successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof ZodError) {
      const errorDetails = error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }))
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: errorDetails,
        },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  )
}
