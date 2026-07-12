import { z } from 'zod'

// Mirrors the Category enum in prisma/schema.prisma. Kept as a plain
// literal list here (rather than importing the generated Prisma enum) so
// this validator has no dependency on the generated client output.
export const CATEGORY_VALUES = [
  'ELECTRONICS',
  'ACCESSORIES',
  'BAGS',
  'DOCUMENTS',
  'KEYS',
  'CLOTHING',
  'BOOKS',
  'OTHER',
] as const

// Shared by both LOST and FOUND reports — only the "when" field's name
// differs (dateLost vs dateFound), matching each endpoint's API contract.
const baseReportFields = {
  title: z
    .string()
    .trim()
    .min(2, 'Title must be at least 2 characters long.')
    .max(120, 'Title must be at most 120 characters long.'),

  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters long.')
    .max(2000, 'Description must be at most 2000 characters long.'),

  category: z.enum(CATEGORY_VALUES),

  location: z
    .string()
    .trim()
    .min(2, 'Location is required.')
    .max(200, 'Location must be at most 200 characters long.'),
}

// Accepts an ISO date string (or anything Date can parse) and coerces it
// to a real Date — Zod rejects anything that doesn't produce a valid date.

export const createLostReportSchema = z.object({
  ...baseReportFields,
  dateLost: z.coerce.date('dateLost must be a valid date.'),
})

export const createFoundReportSchema = z.object({
  ...baseReportFields,
  dateFound: z.coerce.date('dateFound must be a valid date.'),
})

export type CreateLostReportInput = z.infer<typeof createLostReportSchema>
export type CreateFoundReportInput = z.infer<typeof createFoundReportSchema>
