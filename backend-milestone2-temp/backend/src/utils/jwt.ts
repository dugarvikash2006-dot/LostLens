import jwt, { type SignOptions } from 'jsonwebtoken'
import { env } from '../config/env'
import type { Role } from '../generated/prisma/client'

// Explicit algorithm, set on both sign and verify — never trust the
// algorithm embedded in an incoming token.
const JWT_ALGORITHM = 'HS256'

export interface AuthTokenPayload {
  sub: string
  role: Role
}

export function signAuthToken(payload: AuthTokenPayload): string {
  const options: SignOptions = {
    algorithm: JWT_ALGORITHM,
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  }

  return jwt.sign(payload, env.jwtSecret, options)
}

/**
 * Verifies a JWT and returns its payload.
 * Throws (the original jsonwebtoken error) on missing/invalid/expired
 * tokens — callers are responsible for translating that into a safe,
 * generic API error rather than exposing it directly.
 */
export function verifyAuthToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, env.jwtSecret, { algorithms: [JWT_ALGORITHM] })

  if (typeof decoded === 'string' || !decoded) {
    throw new Error('Unexpected token payload shape.')
  }

  const { sub, role } = decoded as Record<string, unknown>

  if (typeof sub !== 'string' || typeof role !== 'string') {
    throw new Error('Unexpected token payload shape.')
  }

  return { sub, role: role as Role }
}
