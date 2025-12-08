import { z } from 'zod'
import { SUPPORT_STATUS } from '../../../enum/support'

export const createSupportSchema = z.object({
  body: z.object({
    userId: z.string().optional(),
    subject: z.string().optional(),
    message: z.string(),
    status: z
      .enum([
        SUPPORT_STATUS.DELETED,
        SUPPORT_STATUS.IN_PROGRESS,
        SUPPORT_STATUS.SOLVED,
      ])
      .optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    attachments: z.array(z.string()).optional(),
  }),
})

export const updateSupportSchema = z.object({
  body: z.object({
    subject: z.string().optional(),
    message: z.string().optional(),
    status: z
      .enum([
        SUPPORT_STATUS.DELETED,
        SUPPORT_STATUS.IN_PROGRESS,
        SUPPORT_STATUS.SOLVED,
      ])
      .optional(),
    attachments: z.array(z.string()).optional(),
  }),
})
