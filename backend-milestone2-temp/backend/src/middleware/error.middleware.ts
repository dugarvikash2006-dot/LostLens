import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../utils/app-error'

/**
 * Centralized error handler — must be registered last, after all routes.
 * Known errors (AppError) are reported with their intended status code
 * and safe message. Anything else is logged server-side only and reported
 * to the client as a generic 500, with no stack trace, no raw Prisma/JWT
 * error, and no internal details.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    const body: { success: false; message: string; errors?: unknown } = {
      success: false,
      message: err.message,
    }

    if (err.details) {
      body.errors = err.details
    }

    res.status(err.statusCode).json(body)
    return
  }

  console.error('Unexpected error:', err)

  res.status(500).json({
    success: false,
    message: 'Internal server error',
  })
}
