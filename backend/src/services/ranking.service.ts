import type { Category, ReportStatus, ReportType } from '../generated/prisma/client'
import { prisma } from '../config/prisma'
import { findSimilarEmbeddings } from './similarity.service'
import type { SimilarityMatch } from './similarity.service'

// Milestone 3C: converts Milestone 3B's similarity results into ranked
// report candidates by applying business rules. This file implements
// business rules only — it never recomputes or adjusts cosine
// similarity; that stays exclusively in similarity.service.ts. No
// automatic matching/linking decision is made here — this only ranks
// candidates for a caller (a future milestone) to act on.

const DEFAULT_TOP_K = 10
export const DEFAULT_MIN_SIMILARITY_THRESHOLD = 0.8

// The schema has no literal "resolved" or "archived" status. RETURNED is
// the closest existing equivalent to "resolved"; CLOSED is the closest
// to "closed/archived". OPEN, POTENTIAL_MATCH, and CLAIM_PENDING remain
// eligible — the business rule says to ignore resolved/closed/archived
// reports, not to require OPEN specifically.
const EXCLUDED_STATUSES: ReportStatus[] = ['RETURNED', 'CLOSED']

// A small bonus added ONLY to an internal sort key (never to the
// reported similarity score itself — rule 6) when a candidate's
// category matches the source report's. Kept well below any similarity
// gap that should be treated as "not comparable", so it can only ever
// re-order candidates whose raw scores were already close, never
// override a genuine similarity difference.
//
// This is deliberately an additive adjustment to a real number rather
// than a discrete "band"/bucket scheme: bucketing (e.g. flooring scores
// into fixed-width bins) has a hard grid-boundary problem — two scores
// only 0.005 apart can land in different buckets purely by chance of
// where the grid lines fall, which defeats "otherwise comparable" for
// exactly the close scores it's meant to catch. Comparing
// `score + bonus` as plain real numbers has no such boundary artifact
// and is trivially transitive (it's just numeric comparison), whereas a
// pairwise "within epsilon of each other" comparator is not guaranteed
// transitive in general.
const CATEGORY_PREFERENCE_BONUS = 0.015

function oppositeReportType(type: ReportType): ReportType {
  return type === 'LOST' ? 'FOUND' : 'LOST'
}

function rankingSortKey(candidate: RankedReportCandidate, sourceCategory?: Category | null): number {
  const matchesSourceCategory = sourceCategory != null && candidate.category === sourceCategory
  return candidate.score + (matchesSourceCategory ? CATEGORY_PREFERENCE_BONUS : 0)
}

export interface RankReportCandidatesInput {
  queryEmbedding: number[]
  /** The report type this query embedding belongs to. Candidates are restricted to the opposite type (rule 1) — never the same type. */
  sourceReportType: ReportType
  /** Enables the same-category preference (rule 5) when provided. Omit if unknown — never inferred or invented. */
  sourceCategory?: Category | null
}

export interface RankReportCandidatesOptions {
  /** Maximum number of ranked reports to return. Defaults to 10. */
  topK?: number
  /** Minimum cosine similarity a candidate must meet. Defaults to 0.80 per business rule 3. */
  minSimilarity?: number
}

export interface RankedReportCandidate {
  reportId: string
  /** Cosine similarity exactly as produced by similarity.service.ts — never modified (rule 6). */
  score: number
  reportType: ReportType
  category: Category
  publicId: string
}

/**
 * Converts a query embedding into ranked, deduplicated report candidates.
 *
 * Business rules applied, in order: opposite report type only (never
 * LOST-LOST or FOUND-FOUND), exclude resolved/closed reports, keep only
 * the highest-scoring embedding per report (a report can have several
 * images), then order by similarity with same-category preferred only
 * as a tie-break among otherwise-comparable scores.
 */
export async function rankReportCandidates(
  input: RankReportCandidatesInput,
  options: RankReportCandidatesOptions = {},
): Promise<RankedReportCandidate[]> {
  const topK = Math.max(0, options.topK ?? DEFAULT_TOP_K)
  const minSimilarity = options.minSimilarity ?? DEFAULT_MIN_SIMILARITY_THRESHOLD

  // Ask for every embedding above the threshold, unbounded — the final
  // topK is applied after dedup/business-rule filtering below, not
  // before, so a report backed by several images isn't lost just
  // because other images crowded out an early raw cutoff.
  const candidates: SimilarityMatch[] = await findSimilarEmbeddings(input.queryEmbedding, {
    minSimilarity,
    topK: Number.MAX_SAFE_INTEGER,
  })

  const candidateReportIds = Array.from(
    new Set(
      candidates
        .filter((candidate): candidate is SimilarityMatch & { reportId: string } => candidate.reportId !== null)
        .map((candidate) => candidate.reportId),
    ),
  )

  if (candidateReportIds.length === 0) {
    return []
  }

  const reports = await prisma.itemReport.findMany({
    where: { id: { in: candidateReportIds } },
    select: { id: true, reportType: true, category: true, status: true },
  })

  const reportById = new Map(reports.map((report) => [report.id, report]))
  const wantedType = oppositeReportType(input.sourceReportType)

  // Rules 1, 2, 4: opposite type only, exclude resolved/closed, keep
  // only the highest-scoring embedding per report.
  const bestPerReport = new Map<string, RankedReportCandidate>()

  for (const candidate of candidates) {
    if (!candidate.reportId) {
      // No report to rank yet (see embedding.service.ts — reportId is
      // only populated once an image is attached to a report).
      continue
    }

    const report = reportById.get(candidate.reportId)
    if (!report) {
      continue
    }

    if (report.reportType !== wantedType) {
      continue
    }

    if (EXCLUDED_STATUSES.includes(report.status)) {
      continue
    }

    const existing = bestPerReport.get(candidate.reportId)
    if (existing && existing.score >= candidate.score) {
      continue
    }

    bestPerReport.set(candidate.reportId, {
      reportId: candidate.reportId,
      score: candidate.score,
      reportType: report.reportType,
      category: report.category,
      publicId: candidate.publicId,
    })
  }

  const ranked = Array.from(bestPerReport.values())

  // Rule 5: same-category preference — a small bonus nudges the sort
  // key, never the reported score itself, so it can only re-order
  // candidates whose raw similarity was already close (rule 6 stays
  // intact: `score` on each returned candidate is untouched above).
  ranked.sort((a, b) => {
    const keyDifference = rankingSortKey(b, input.sourceCategory) - rankingSortKey(a, input.sourceCategory)
    return keyDifference !== 0 ? keyDifference : b.score - a.score
  })

  return ranked.slice(0, topK)
}
