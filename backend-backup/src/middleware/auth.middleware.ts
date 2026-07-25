import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../utils/app-error'
import { verifyAuthToken } from '../utils/jwt'

/**
 * Requires a valid `Authorization: Bearer <token>` header. On success,
 * attaches the authenticated identity to req.user. Never exposes the
 * underlying jsonwebtoken error (e.g. exact expiry time, malformed
 * signature details) to the client.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization

  if (!header) {
    next(new AppError(401, 'Authentication required.'))
    return
  }

  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    next(new AppError(401, 'Malformed Authorization header. Expected: Bearer <token>'))
    return
  }

  try {
    const payload = verifyAuthToken(token)
    req.user = { id: payload.sub, role: payload.role }
    next()
  } catch {
    next(new AppError(401, 'Invalid or expired token.'))
  }
}
