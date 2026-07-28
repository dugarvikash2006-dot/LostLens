import type { Category, ReportType } from '../generated/prisma/client'
import { prisma } from '../config/prisma'
import { rankReportCandidates } from './ranking.service'

// Milestone 3D: orchestrates the existing embedding -> similarity ->
// ranking pipeline for a single, just-created report, and persists the
// resulting ranked candidates as Match rows. This file is orchestration
// only — it calls similarity.service.ts and ranking.service.ts exactly
// as they already exist, and never recomputes or adjusts either's math
// or business rules.

export interface ReportForSuggestions {
  id: string
  reportType: ReportType
  category: Category
}

/**
 * Generates and persists AI suggestions for a newly created report.
 *
 * "Its embedding" (singular, matching this milestone's scope): a report
 * can have up to 5 images, each with its own embedding. The first one
 * uploaded is used as the report's representative query vector —
 * combining multiple images into one query (e.g. averaging) is
 * deliberately out of scope here.
 *
 * Each ranked candidate becomes (or updates) a Match row, keyed on the
 * lost/found pair so re-running this is safe and idempotent. Only
 * `imageScore` is ever written — scaled to the 0-100 scale this model
 * already uses (see seed.ts) rather than raw 0-1 cosine similarity.
 * `status` is never touched on an update, so a human decision already
 * recorded on an existing match (REVIEWING/ACCEPTED/REJECTED) is never
 * silently reset back to SUGGESTED.
 *
 * Best-effort: never throws. A failure here must never affect whether
 * the report itself was created, matching the same convention already
 * established for embedding generation (3A) and embedding linking
 * (3C.5).
 */
export async function generateSuggestionsForReport(report: ReportForSuggestions): Promise<void> {
  try {
    const sourceEmbedding = await prisma.reportImageEmbedding.findFirst({
      where: { reportId: report.id },
      orderBy: { createdAt: 'asc' },
      select: { embedding: true },
    })

    if (!sourceEmbedding) {
      // No image / no embedding for this report yet — nothing to suggest.
      return
    }

    const candidates = await rankReportCandidates({
      queryEmbedding: sourceEmbedding.embedding,
      sourceReportType: report.reportType,
      sourceCategory: report.category,
    })

    const isSourceLost = report.reportType === 'LOST'

    for (const candidate of candidates) {
      const lostItemId = isSourceLost ? report.id : candidate.reportId
      const foundItemId = isSourceLost ? candidate.reportId : report.id

      await prisma.match.upsert({
        where: { lostItemId_foundItemId: { lostItemId, foundItemId } },
        create: {
          lostItemId,
          foundItemId,
          imageScore: candidate.score * 100,
        },
        update: {
          imageScore: candidate.score * 100,
        },
      })
    }
  } catch (error) {
    console.error(`Failed to generate AI suggestions for report ${report.id}:`, error)
  }
}
