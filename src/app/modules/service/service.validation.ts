import { z } from 'zod'

export const ServiceValidations = {
  create: z.object({
    body: z.object({
      name: z.string(),
      description: z.string(),
      servicesProvided: z.array(z.string()),
      occasions: z.array(z.string()),
    }),
  }),

  update: z.object({
    body: z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      servicesProvided: z.array(z.string()).optional(),
      occasions: z.array(z.string()).optional(),
    }),
  }),
}
