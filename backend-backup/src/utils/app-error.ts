// A lightweight, typed error for anything the API should report to the
// client with a specific status code and safe message. Thrown from
// services/middleware, caught by the centralized error handler.
export class AppError extends Error {
  public readonly statusCode: number
  // Optional structured details — used for validation error field lists.
  // Never used to carry raw internal errors, stack traces, or secrets.
  public readonly details?: unknown

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.details = details
    Object.setPrototypeOf(this, AppError.prototype)
  }
}
