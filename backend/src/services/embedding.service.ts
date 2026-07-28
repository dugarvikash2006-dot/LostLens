import { prisma } from '../config/prisma'
import { getImageEmbedding, logEmbeddingSummary } from './ai.service'
import type { UploadedImage } from './upload.service'

// Milestone 3A: persist OpenCLIP embeddings for uploaded images. No
// similarity search, ranking, or matching logic reads this table yet —
// that's later milestones (3B-3D). Keep this service focused on
// request -> persist so it stays a stable building block for them,
// rather than growing matching-specific logic here.

/**
 * Requests an OpenCLIP embedding for an already-uploaded image and
 * persists it as a ReportImageEmbedding row (reportId left null — this
 * runs before any report exists to link it to; see schema.prisma).
 *
 * Never throws. Every failure mode — AI service unreachable, malformed
 * or dimensionally-inconsistent response, database write failure — is
 * caught, logged, and swallowed here (or earlier, in getImageEmbedding),
 * so a caller can fire this off without ever risking the operation that
 * triggered it (an image upload).
 */
export interface StoredEmbedding {
  id: string
  reportId: string | null
  publicId: string
  embedding: number[]
}

/**
 * Returns every persisted embedding, unfiltered. Milestone 3B's
 * similarity search iterates over this in memory rather than querying
 * for a subset — no reportType/category/status filtering happens here,
 * since that would be matching logic, not embedding persistence.
 */
export async function getAllStoredEmbeddings(): Promise<StoredEmbedding[]> {
  return prisma.reportImageEmbedding.findMany({
    select: {
      id: true,
      reportId: true,
      publicId: true,
      embedding: true,
    },
  })
}

export async function generateAndStoreEmbedding(image: UploadedImage): Promise<void> {
  const result = await getImageEmbedding(image.imageUrl)

  if (!result) {
    // getImageEmbedding already logged the specific reason (unreachable,
    // timeout, non-2xx, bad or dimensionally-inconsistent shape) —
    // nothing more to do here.
    return
  }

  try {
    await prisma.reportImageEmbedding.create({
      data: {
        publicId: image.publicId,
        imageUrl: image.imageUrl,
        embedding: result.embedding,
        embeddingDimension: result.dimensions,
        modelName: result.modelName,
      },
    })
    logEmbeddingSummary(image.imageUrl, result)
  } catch (error) {
    console.error(`Failed to persist embedding for ${image.imageUrl}:`, error)
  }
}
