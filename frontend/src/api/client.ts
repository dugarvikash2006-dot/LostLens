// Reusable request layer so components never call fetch() directly or
// duplicate URL/header/error-parsing logic.

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5001'

/**
 * A real HTTP response from the backend that indicated failure
 * (4xx/5xx). `status` is the real HTTP status code, and `message`/`errors`
 * are taken from the backend's safe JSON error shape when present.
 */
export class ApiError extends Error {
  status: number
  errors?: { field: string; message: string }[]

  constructor(status: number, message: string, errors?: { field: string; message: string }[]) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

/**
 * We never got a response at all — offline, DNS failure, CORS rejection,
 * or the backend simply isn't running. Distinct from ApiError so callers
 * can tell "the server said no" apart from "we couldn't reach the server".
 * Uses status 0, which no real HTTP response can have.
 */
export class NetworkError extends ApiError {
  constructor(message = 'Unable to reach the server. Check your connection and try again.') {
    super(0, message)
    this.name = 'NetworkError'
  }
}

interface BackendErrorShape {
  message?: unknown
  errors?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseBackendErrorShape(payload: unknown): BackendErrorShape {
  return isRecord(payload) ? payload : {}
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  /** Attached as `Authorization: Bearer <token>` when provided. */
  token?: string | null
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    // fetch() only throws for network-level failures, never for HTTP
    // error statuses — those are handled below via response.ok.
    throw new NetworkError()
  }

  let payload: unknown = null

  try {
    payload = await response.json()
  } catch {
    // Empty or non-JSON body. payload stays null; handled below.
  }

  if (!response.ok) {
    const shape = parseBackendErrorShape(payload)
    const message =
      typeof shape.message === 'string' && shape.message.trim() !== ''
        ? shape.message
        : `Request failed with status ${response.status}.`

    const errors = Array.isArray(shape.errors)
      ? (shape.errors as { field: string; message: string }[])
      : undefined

    throw new ApiError(response.status, message, errors)
  }

  return payload as T
}
