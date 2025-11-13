import { z } from 'zod'

export const BookingValidations = {
  create: z.object({
    body: z.object({
      user: z.string().optional(),
      type: z.enum(['cleaning', 'grocery', 'maintenance']),
      date: z.date(),
      startTime: z.date().optional(),
      endTime: z.date().optional(),
      address: z.object({
        address: z.string(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
      }),
      notes: z.string().optional(),
      status: z
        .enum(['pending', 'confirmed', 'completed', 'cancelled'])
        .optional(),
      recurring: z.string().optional(),
      reminders: z.array(z.string()).optional(),
    }),
  }),
}
