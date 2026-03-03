import { z } from 'zod'

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId')

// Preprocess to ensure date is valid
const dateField = z.preprocess(val => {
  if (!val) return undefined
  const d = new Date(val as string)
  if (isNaN(d.getTime())) return undefined
  // zero out time to store day only
  d.setHours(0, 0, 0, 0)
  return d
}, z.date())

// Validate time as HH:mm string
const timeField = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)')

export const BookingValidations = {
  create: z.object({
    body: z.object({
      user: objectId.optional(),
      service: objectId.optional(),
      staff: objectId.optional(),

      date: dateField, // required

      address: z
        .object({
          address: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
        })
        .optional(),

      serviceType: z.object({
        title: z.string(),
        description: z.string().optional(),
      }).optional(),

      serviceDetails: z
        .array(
          z.object({
            name: z.string(),
            value: z.union([z.string(), z.number(), z.boolean()]).optional(),
          }),
        )
        .default([]),

      notes: z.string().optional(),

      status: z
        .enum([
          'confirmed',
          'inProgress',
          'completed',
          'cancelled',
          'requested',
          'scheduled',
        ])
        .optional(),
    }),
  }),

  updateBookingStatus: z.object({
    body: z.object({
      status: z.enum([
        'confirmed',
        'inProgress',
        'completed',
        'cancelled',
        'requested',
        'scheduled',
      ]),
    }),
  }),

  update: z.object({
    body: z.object({
      status: z
        .enum([
          'confirmed',
          'inProgress',
          'completed',
          'cancelled',
          'requested',
          'scheduled',
        ])
        .optional(),
    }),
  }),

  updatePrice: z.object({
    body: z.object({
      price: z.number().nonnegative(),
    }),
  }),

  assignStaff: z.object({
    body: z.object({
      staffId: objectId,
    }),
  }),

  updateFees: z.object({
    body: z.object({
      bookingFee: z.number().nonnegative().optional(),
      serviceCharge: z.number().nonnegative().optional(),
    }),
  }),

  groceryChat: z.object({
    body: z.object({
      sessionId: objectId.optional(),
      message: z.string().min(1, 'Message is required'),
    }),
  }),

  confirmGroceryChat: z.object({
    body: z.object({
      sessionId: objectId,
    }),
  }),

  reuseGroceryChat: z.object({
    body: z.object({
      sessionId: objectId,
      pastOrderId: objectId,
    }),
  }),
}
