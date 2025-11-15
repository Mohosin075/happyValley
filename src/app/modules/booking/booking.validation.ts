import { z } from 'zod'

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId')

const dateField = z.preprocess(val => {
  if (!val) return undefined
  const d = new Date(val as string)
  return isNaN(d.getTime()) ? undefined : d
}, z.date())

export const BookingValidations = {
  create: z.object({
    body: z.object({
      user: objectId.optional(),
      service: objectId.optional(),
      staff: objectId.optional(),

      date: dateField, // required
      startTime: dateField.optional(),
      endTime: dateField.optional(),

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
      }),

      fields: z
        .array(
          z.object({
            name: z.string(),
            value: z.union([z.string(), z.number(), z.boolean()]).optional(),
          }),
        )
        .default([]),

      notes: z.string().optional(),

      status: z
        .enum(['pending', 'confirmed', 'completed', 'cancelled', 'rejected'])
        .optional(),
    }),
  }),
}
