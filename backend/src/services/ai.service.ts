import { env } from '../config/env'

export interface ImageEmbedding {
  dimensions: number
  embedding: number[]
  modelName: string
}

// Bounds how long we'll wait on the AI service before giving up. Keeps a
// slow/unreachable AI service from hanging an image upload indefinitely,
// while still giving a locally-running model a fair chance to respond.
const EMBED_REQUEST_TIMEOUT_MS = 5000

function isEmbeddingShape(value: unknown): value is ImageEmbedding {
  if (
    typeof value !== 'object' ||
    value === null ||
    typeof (value as Record<string, unknown>).dimensions !== 'number' ||
    !Array.isArray((value as Record<string, unknown>).embedding) ||
    typeof (value as Record<string, unknown>).modelName !== 'string'
  ) {
    return false
  }

  // A response can have the right field types but still be internally
  // inconsistent (e.g. a truncated vector) — checking that here means
  // every caller of getImageEmbedding gets a vector it can trust
  // unconditionally, rather than each one re-deriving this check itself.
  const { dimensions, embedding } = value as ImageEmbedding
  return dimensions > 0 && dimensions === embedding.length
}

/**
 * Asks the standalone AI service (FastAPI, POST /embed) for an embedding
 * of an already-uploaded image URL.
 *
 * This is a best-effort, non-critical call at this stage: the AI service
 * is a separate process that may not be running, may be slow, or may
 * error — none of that should ever bubble up as a failure of whatever
 * triggered this call (e.g. an image upload). Every failure mode (network
 * error, timeout, non-2xx response, unexpected response shape) is caught
 * here, logged, and reported back as `null` rather than thrown.
 */
export async function getImageEmbedding(imageUrl: string): Promise<ImageEmbedding | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), EMBED_REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${env.aiServiceUrl}/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl }),
      signal: controller.signal,
    })

    if (!response.ok) {
      console.error(
        `AI service returned status ${response.status} for image embedding request (${imageUrl}).`,
      )
      return null
    }

    const data: unknown = await response.json()

    if (!isEmbeddingShape(data)) {
      console.error('AI service returned an unexpected response shape for image embedding.')
      return null
    }

    return data
  } catch (error) {
    // Covers connection refused (AI service not running), DNS failure,
    // and timeouts (AbortError) alike — the AI service being unreachable
    // is treated as a normal, expected possibility, not an exception to
    // propagate.
    const reason = error instanceof Error ? error.message : String(error)
    console.error(`Failed to reach the AI service for image embedding (${imageUrl}): ${reason}`)
    return null
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Logs a safe summary of an embedding — dimensions and only the first 5
 * values, never the full vector (which would flood logs with hundreds of
 * numbers nobody reads).
 */
export function logEmbeddingSummary(imageUrl: string, embedding: ImageEmbedding): void {
  const preview = embedding.embedding.slice(0, 5)
  console.log(
    `AI embedding generated for ${imageUrl}: dimensions=${embedding.dimensions}, ` +
      `first 5 values=[${preview.join(', ')}]`,
  )
}
