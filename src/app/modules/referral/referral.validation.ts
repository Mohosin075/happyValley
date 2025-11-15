import { z } from 'zod'

export const ReferralValidations = {
  create: z.object({
    body: z.object({
      yourName: z.string(),
      referralName: z.string(),
      referralEmail: z.string().optional(),
      referralPhone: z.string().optional(),
      notes: z.string().optional(),
      referredBy: z.string().optional(),
      status: z.enum(['pending', 'accepted', 'rejected']).optional(),
    }),
  }),

  update: z.object({
    body: z.object({
      yourName: z.string().optional(),
      referralName: z.string().optional(),
      referralEmail: z.string().optional(),
      referralPhone: z.string().optional(),
      notes: z.string().optional(),
      referredBy: z.string().optional(),
    }),
  }),
}
