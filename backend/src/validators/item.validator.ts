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

// Mirrors the ReportStatus enum in prisma/schema.prisma — used to
// validate the optional `status` filter on the browse endpoints.
export const REPORT_STATUS_VALUES = [
  'OPEN',
  'POTENTIAL_MATCH',
  'CLAIM_PENDING',
  'RETURNED',
  'CLOSED',
  'REUNITED',
] as const

// Mirrors the ReunionMethod enum in prisma/schema.prisma.
export const REUNION_METHOD_VALUES = [
  'AI_MATCH',
  'CONTACTED_ME',
  'MANUAL_SEARCH',
  'CAMPUS_SECURITY',
  'FRIEND',
] as const

// Lenient on purpose — "basic formatting" per the product spec, not full
// E.164 validation. Allows digits, spaces, and the punctuation people
// actually type in a phone number.
const PHONE_REGEX = /^[0-9+\-\s()]{7,20}$/

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

  // References to images already uploaded via POST /api/items/upload —
  // this endpoint never accepts raw file data itself. Optional: a report
  // can have zero images.
  images: z
    .array(
      z.object({
        imageUrl: z.url('Each image must have a valid URL.'),
        publicId: z.string().min(1, 'Each image is missing its publicId.'),
      }),
    )
    .max(5, 'You can attach at most 5 images.')
    .optional(),

  // Phase 7: all three independently optional — a reporter may give only
  // a phone, only an email, both, or neither. Empty strings are treated
  // the same as omitted (a form field left blank shouldn't fail
  // validation), normalized to undefined so the service layer only ever
  // deals with "present and non-empty" or "absent".
  contactName: z
    .string()
    .trim()
    .max(120, 'Name must be at most 120 characters long.')
    .optional()
    .transform((value) => (value ? value : undefined)),

  contactPhone: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine((value) => value === undefined || PHONE_REGEX.test(value), {
      message: 'Enter a valid phone number.',
    }),

  contactEmail: z
    .string()
    .trim()
    .toLowerCase()
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine((value) => value === undefined || z.email().safeParse(value).success, {
      message: 'Invalid email address.',
    }),
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
  // Phase 7: FOUND-only — where the item can currently be picked up.
  // Optional, same reasoning as the contact fields above.
  currentLocation: z
    .string()
    .trim()
    .max(200, 'Current location must be at most 200 characters long.')
    .optional()
    .transform((value) => (value ? value : undefined)),
})

export type CreateLostReportInput = z.infer<typeof createLostReportSchema>
export type CreateFoundReportInput = z.infer<typeof createFoundReportSchema>

// ---------------- Browse (Phase 7) ----------------

// Query-string params are always strings (or absent) — this schema
// normalizes and validates them, rather than trusting req.query as-is.
// Invalid `category`/`status`/`sort` values are dropped (treated as "no
// filter") instead of rejected outright, since a browse page's filters
// should degrade gracefully rather than 400 a user for a stale bookmark.
export const browseReportsQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((value) => (value ? value : undefined)),
  category: z.enum(CATEGORY_VALUES).optional().catch(undefined),
  status: z.enum(REPORT_STATUS_VALUES).optional().catch(undefined),
  sort: z.enum(['newest', 'oldest']).catch('newest'),
})

export type BrowseReportsQuery = z.infer<typeof browseReportsQuerySchema>

// ---------------- Reunite (Phase 8) ----------------

// Body for PATCH .../:id/reunite. `reunionMethod` is optional and
// independent of the status change itself — the frontend calls this
// endpoint once (no body) to mark REUNITED, then optionally again later
// (reunionMethod only) if the user answers the follow-up prompt.
export const reuniteReportSchema = z.object({
  reunionMethod: z.enum(REUNION_METHOD_VALUES).optional(),
})

export type ReuniteReportInput = z.infer<typeof reuniteReportSchema>
