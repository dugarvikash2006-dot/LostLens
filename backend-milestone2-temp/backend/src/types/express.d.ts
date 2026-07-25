import type { Role } from '../generated/prisma/client'

declare global {
  namespace Express {
    interface Request {
      /**
       * Populated by the `requireAuth` middleware after successful JWT
       * verification. Absent on unauthenticated requests.
       */
      user?: {
        id: string
        role: Role
      }
    }
  }
}

export {}
