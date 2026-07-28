import { getAllStoredEmbeddings } from './embedding.service'

// Milestone 3B: cosine similarity search over persisted embeddings.
// Storage-and-retrieval only, same as 3A's scope discipline — no
// matching decisions, ranking beyond similarity score, or automatic
// suggestions happen here. Those are later milestones (3C/3D), which
// this file is deliberately kept small and dependency-free enough to
// build on.

const DEFAULT_TOP_K = 10
const DEFAULT_MIN_SIMILARITY = 0

// ---------------------------------------------------------------------------
// Pure similarity math — isolated from persistence/orchestration below so
// it stays trivially testable and reusable on its own.
// ---------------------------------------------------------------------------

/**
 * Cosine similarity between two numeric vectors, in the range [-1, 1].
 *
 * Returns `null` instead of throwing for any input that can't produce a
 * meaningful score: empty vectors, mismatched dimensions, a
 * zero-magnitude vector (which would divide by zero), or a vector
 * containing non-finite/corrupt values. A corrupt element (NaN,
 * non-number) isn't checked individually — it naturally poisons the
 * running dot-product/norm sums to NaN, which the final
 * `Number.isFinite` check below catches uniformly, so one check covers
 * every corruption case instead of validating each element up front.
 */
export function cosineSimilarity(a: number[], b: number[]): number | null {
  if (!Array.isArray(a) || !Array.isArray(b)) {
    return null
  }

  if (a.length === 0 || b.length === 0) {
    return null
  }

  if (a.length !== b.length) {
    return null
  }

  let dot = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB)

  if (magnitude === 0) {
    return null
  }

  const similarity = dot / magnitude

  if (!Number.isFinite(similarity)) {
    return null
  }

  // Cosine similarity is mathematically bounded to [-1, 1], but
  // floating-point rounding in the sums above can push a result of two
  // identical (or near-identical) vectors marginally outside that range
  // (e.g. 1.0000000000000002) — clamp rather than let that leak out.
  return Math.min(1, Math.max(-1, similarity))
}

// ---------------------------------------------------------------------------
// Retrieval + ranking orchestration
// ---------------------------------------------------------------------------

export interface SimilarityMatch {
  embeddingId: string
  reportId: string | null
  publicId: string
  score: number
}

export interface FindSimilarEmbeddingsOptions {
  /** Maximum number of results to return. Defaults to 10. */
  topK?: number
  /** Minimum cosine similarity a result must meet to be included. Defaults to 0 (no filtering). */
  minSimilarity?: number
}

/**
 * Given a query embedding, returns the Top-K most similar stored
 * embeddings by cosine similarity, ordered highest to lowest.
 *
 * Storage is read in full and scored in memory — simple iteration over
 * every stored embedding, no ANN index or pgvector, per this milestone's
 * scope. Any stored embedding that fails validation (dimension mismatch
 * against the query vector, zero magnitude, corrupt values) is skipped
 * rather than aborting the whole search.
 */
export async function findSimilarEmbeddings(
  queryEmbedding: number[],
  options: FindSimilarEmbeddingsOptions = {},
): Promise<SimilarityMatch[]> {
  const topK = Math.max(0, options.topK ?? DEFAULT_TOP_K)
  const minSimilarity = options.minSimilarity ?? DEFAULT_MIN_SIMILARITY

  const stored = await getAllStoredEmbeddings()

  const matches: SimilarityMatch[] = []

  for (const candidate of stored) {
    const score = cosineSimilarity(queryEmbedding, candidate.embedding)

    if (score === null || score < minSimilarity) {
      continue
    }

    matches.push({
      embeddingId: candidate.id,
      reportId: candidate.reportId,
      publicId: candidate.publicId,
      score,
    })
  }

  matches.sort((a, b) => b.score - a.score)

  return matches.slice(0, topK)
}
