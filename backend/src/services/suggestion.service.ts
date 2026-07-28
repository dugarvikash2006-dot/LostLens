import type { Category, MatchStatus, ReportStatus, ReportType } from '../generated/prisma/client'
import { prisma } from '../config/prisma'
import { rankReportCandidates } from './ranking.service'
import { AppError } from '../utils/app-error'

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

// ---------------------------------------------------------------------------
// Phase 4: read-only access to already-generated suggestions
// ---------------------------------------------------------------------------

export interface ReportSuggestion {
  matchId: string
  /** The suggested candidate report's id — never the report being viewed. */
  reportId: string
  reportType: ReportType
  itemName: string
  category: Category
  location: string
  eventDate: Date
  /** The candidate report's own status (OPEN, RETURNED, etc). */
  status: ReportStatus
  /** The Match row's own lifecycle status (SUGGESTED/REVIEWING/ACCEPTED/REJECTED). */
  matchStatus: MatchStatus
  /** imageScore on its stored 0-100 scale, or null if not yet computed. */
  score: number | null
  thumbnail: string | null
}

// Shared between lostItem/foundItem below so the candidate's shape is
// defined once rather than duplicated per side.
const CANDIDATE_SELECT = {
  id: true,
  reportType: true,
  itemName: true,
  category: true,
  location: true,
  eventDate: true,
  status: true,
  images: {
    take: 1,
    orderBy: { createdAt: 'asc' as const },
    select: { imageUrl: true },
  },
} as const

/**
 * Reads already-generated AI suggestions (Match rows) for a report the
 * requesting user owns. Read-only — this never recomputes anything; the
 * embedding -> similarity -> ranking pipeline that produces these rows
 * runs exactly once, at report-creation time (generateSuggestionsForReport).
 *
 * Same ownership rule as the other report-reading endpoints (404 if the
 * report doesn't exist, 403 if it exists but isn't the caller's).
 */
export async function getSuggestionsForReport(
  reportId: string,
  requestingUserId: string,
): Promise<ReportSuggestion[]> {
  const report = await prisma.itemReport.findUnique({
    where: { id: reportId },
    select: { id: true, userId: true },
  })

  if (!report) {
    throw new AppError(404, 'Report not found.')
  }

  if (report.userId !== requestingUserId) {
    throw new AppError(403, 'You do not have permission to view suggestions for this report.')
  }

  const matches = await prisma.match.findMany({
    where: { OR: [{ lostItemId: reportId }, { foundItemId: reportId }] },
    include: {
      lostItem: { select: CANDIDATE_SELECT },
      foundItem: { select: CANDIDATE_SELECT },
    },
    orderBy: { imageScore: 'desc' },
  })

  return matches.map((match) => {
    const candidate = match.lostItemId === reportId ? match.foundItem : match.lostItem

    return {
      matchId: match.id,
      reportId: candidate.id,
      reportType: candidate.reportType,
      itemName: candidate.itemName,
      category: candidate.category,
      location: candidate.location,
      eventDate: candidate.eventDate,
      status: candidate.status,
      matchStatus: match.status,
      score: match.imageScore === null ? null : match.imageScore.toNumber(),
      thumbnail: candidate.images[0]?.imageUrl ?? null,
    }
  })
}
