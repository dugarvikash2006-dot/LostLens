import { z } from 'zod'

export const signupSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters long.')
    .max(80, 'Full name must be at most 80 characters long.'),

  email: z.string().trim().toLowerCase().email('Invalid email address.'),

  // Sensible baseline policy: long enough, and not just digits or just
  // letters. Kept simple deliberately — this is not the place for
  // exotic complexity rules that tend to produce weaker passwords in
  // practice.
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .max(72, 'Password must be at most 72 characters long.')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.'),
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address.'),
  // Deliberately not re-validating password strength on login — this is
  // just "was something submitted", not a policy check.
  password: z.string().min(1, 'Password is required.'),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
