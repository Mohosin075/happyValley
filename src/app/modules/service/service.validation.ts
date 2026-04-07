import { z } from 'zod'

export const ServiceValidations = {
  create: z.object({
    body: z.object({
      name: z.string(),
      description: z.string().optional(),
      image: z.string().optional(),
      images: z.array(z.string()).optional(),
      servicesProvided: z.array(z.string()).optional(),
      occasions: z.array(z.string()).optional(),
      staff: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(), // ObjectId strings
      serviceType: z
        .array(
          z.object({
            title: z.string(),
            description: z.string(),
          }),
        )
        .optional(),
      fields: z
        .array(
          z.object({
            name: z.string(),
            type: z.enum(['string', 'number', 'boolean']), // stricter typing
            label: z.string(),
          }),
        )
        .optional(),
    }),
  }),

  update: z.object({
    body: z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      servicesProvided: z.array(z.string()).optional(),
      occasions: z.array(z.string()).optional(),
      image: z.string().optional(),
      images: z.array(z.string()).optional(),
      staff: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
      serviceType: z
        .array(
          z.object({
            title: z.string(),
            description: z.string(),
          }),
        )
        .optional(),
      fields: z
        .array(
          z.object({
            name: z.string(),
            type: z.enum(['string', 'number', 'boolean']),
            label: z.string(),
          }),
        )
        .optional(),
    }),
  }),
}
