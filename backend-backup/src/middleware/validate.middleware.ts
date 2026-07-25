import type { NextFunction, Request, Response } from 'express'
import type { ZodType } from 'zod'
import { AppError } from '../utils/app-error'

/**
 * Validates req.body against the given Zod schema. On success, replaces
 * req.body with the parsed (trimmed/normalized) data. On failure, forwards
 * a 400 AppError with a safe, consistent field/message error list — never
 * the raw ZodError.
 */
export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.length > 0 ? issue.path.join('.') : 'body',
        message: issue.message,
      }))

      next(new AppError(400, 'Validation failed', errors))
      return
    }

    req.body = result.data
    next()
  }
}
