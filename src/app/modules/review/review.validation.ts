import { z } from 'zod'

export const createReviewSchema = z.object({
  body: z.object({
    service: z.string(),
    reviewee: z.string().optional(),
    rating: z.number(),
    review: z.string(),
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
  }),
})

export const updateReviewSchema = z.object({
  body: z.object({
    reviewee: z.string().optional(),
    rating: z.number().optional(),
    review: z.string().optional(),
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
  }),
})
