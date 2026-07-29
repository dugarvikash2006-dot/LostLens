import { prisma } from '../config/prisma'
import { AppError } from '../utils/app-error'
import { linkEmbeddingsToReport } from './embedding.service'
import { generateSuggestionsForReport } from './suggestion.service'
import type {
  CreateLostReportInput,
  CreateFoundReportInput,
  BrowseReportsQuery,
  ReuniteReportInput,
} from '../validators/item.validator'

type ReunionMethod = NonNullable<ReuniteReportInput['reunionMethod']>

// This phase creates LOST and FOUND reports, optionally with images
// (Phase 3C) — no matching, claims, or notifications yet. The underlying
// ItemReport model already supports all of that, but these services
// intentionally only exercise the plain create/list/get-by-id slice of it.
//
// LOST and FOUND share identical create/list/get-by-id logic and differ
// only in the `reportType` they filter/store by, so that logic lives once
// in the internal helpers below. The exported functions are thin,
// specifically-named wrappers around them — callers (controllers) still
// get a clear, explicit function per report type rather than having to
// pass a reportType string around themselves.

type ReportType = 'LOST' | 'FOUND'

// LOST and FOUND share the same category enum — reuse the type Zod
// already inferred rather than widening to a bare `string`, so this
// still lines up with what Prisma's generated Category type expects.
type CategoryValue = CreateLostReportInput['category']

interface ImageReference {
  imageUrl: string
  publicId: string
}

interface CreateReportFields {
  title: string
  description: string
  category: CategoryValue
  location: string
  eventDate: Date
  images?: ImageReference[]
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  // FOUND-only in practice (createLostReport never passes this), but
  // lives here since createReport is the single shared create path.
  currentLocation?: string
}

// Every read of a report includes its images — callers always get the
// full picture (including an empty array) rather than having to
// remember a separate include.
const REPORT_INCLUDE = { images: true } as const

async function createReport(ownerId: string, reportType: ReportType, input: CreateReportFields) {
  const report = await prisma.itemReport.create({
    data: {
      userId: ownerId,
      reportType,
      itemName: input.title,
      category: input.category,
      description: input.description,
      location: input.location,
      eventDate: input.eventDate,
      currentLocation: input.currentLocation,
      contactName: input.contactName,
      contactPhone: input.contactPhone,
      contactEmail: input.contactEmail,
      // status defaults to OPEN at the schema level
      images:
        input.images && input.images.length > 0
          ? {
              create: input.images.map((image) => ({
                imageUrl: image.imageUrl,
                publicId: image.publicId,
              })),
            }
          : undefined,
    },
    include: REPORT_INCLUDE,
  })

  // Milestone 3C.5: the embeddings for these images were generated at
  // upload time, before this report existed (see embedding.service.ts) —
  // link them now that a report id is finally available.
  if (input.images && input.images.length > 0) {
    await linkEmbeddingsToReport(
      report.id,
      input.images.map((image) => image.publicId),
    )
  }

  // Milestone 3D: must run after linking above — it looks up this
  // report's own embedding via reportId, which linkEmbeddingsToReport
  // just populated.
  await generateSuggestionsForReport(report)

  return report
}

async function getMyReports(ownerId: string, reportType: ReportType) {
  return prisma.itemReport.findMany({
    where: {
      userId: ownerId,
      reportType,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: REPORT_INCLUDE,
  })
}

// Phase 7: viewing a report by id is no longer owner-restricted — Browse
// and the contact-info fields on a report only make sense if another
// user can actually open it. `requestingUserId` is kept as a parameter
// (unused here) so callers/controllers don't need to change, and so a
// future per-viewer concern (e.g. "hide X from non-owners") has an
// obvious place to hook in. Ownership still gates everything that
// *changes* a report (see deleteReport below), and gates the
// owner-only Lens Match/legacy-match sections the frontend renders.
async function getReportById(
  reportId: string,
  _requestingUserId: string,
  reportType: ReportType,
) {
  const report = await prisma.itemReport.findUnique({
    where: { id: reportId },
    include: {
      ...REPORT_INCLUDE,
      // Phase 8/9: when the earliest AI candidate was found for this
      // report, if ever — just a timestamp, never the candidate's
      // identity, so it's safe to expose to any viewer (unlike the full
      // suggestion list, which stays owner-only). Backs the "Potential
      // match detected" activity-history entry in Report Details, with
      // a real date rather than a boolean.
      lostMatches: { select: { createdAt: true }, orderBy: { createdAt: 'asc' }, take: 1 },
      foundMatches: { select: { createdAt: true }, orderBy: { createdAt: 'asc' }, take: 1 },
    },
  })

  if (!report || report.reportType !== reportType) {
    throw new AppError(404, 'Report not found.')
  }

  const { lostMatches, foundMatches, ...rest } = report
  const matchDates = [...lostMatches, ...foundMatches].map((match) => match.createdAt)
  const aiMatchFoundAt =
    matchDates.length > 0
      ? new Date(Math.min(...matchDates.map((date) => date.getTime())))
      : null

  return { ...rest, aiMatchFoundAt }
}

async function deleteReport(reportId: string, requestingUserId: string, reportType: ReportType) {
  const report = await prisma.itemReport.findUnique({
    where: { id: reportId },
    select: { id: true, userId: true, reportType: true },
  })

  if (!report || report.reportType !== reportType) {
    throw new AppError(404, 'Report not found.')
  }

  if (report.userId !== requestingUserId) {
    throw new AppError(403, 'You do not have permission to delete this report.')
  }

  // ReportImage, ReportImageEmbedding, and Match (both sides) all
  // cascade on ItemReport deletion at the schema level — a single
  // delete here is enough to clean up everything that references this
  // report.
  await prisma.itemReport.delete({ where: { id: reportId } })
}

// Phase 7: Browse — unlike getMyReports, not scoped to a single owner.
// Supports the same shape of filters a user would expect from a search
// page: free-text search (title/description), category, status, and a
// newest/oldest sort. No pagination — every other listing endpoint in
// this codebase returns its full result set unpaginated too, and the
// app doesn't operate at a scale where that's a problem yet.
//
// Phase 8: reunited reports are hidden by default (a browsing user is
// almost always looking for something still outstanding) unless the
// caller explicitly asks for them via `status: 'REUNITED'` — the
// Browse page's "Reunited" filter does exactly that.
async function browseReports(reportType: ReportType, query: BrowseReportsQuery) {
  return prisma.itemReport.findMany({
    where: {
      reportType,
      ...(query.category ? { category: query.category } : {}),
      status: query.status ? query.status : { not: 'REUNITED' },
      ...(query.search
        ? {
            OR: [
              { itemName: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: {
      createdAt: query.sort === 'oldest' ? 'asc' : 'desc',
    },
    include: REPORT_INCLUDE,
  })
}

async function reuniteReport(
  reportId: string,
  requestingUserId: string,
  reportType: ReportType,
  reunionMethod: ReunionMethod | undefined,
) {
  const report = await prisma.itemReport.findUnique({
    where: { id: reportId },
    select: { id: true, userId: true, reportType: true, reunitedAt: true },
  })

  if (!report || report.reportType !== reportType) {
    throw new AppError(404, 'Report not found.')
  }

  if (report.userId !== requestingUserId) {
    throw new AppError(403, 'You do not have permission to update this report.')
  }

  // Idempotent by design: calling this a second time (e.g. the optional
  // "how did the reunion happen?" follow-up, which only sends
  // reunionMethod) sets the method without re-stamping reunitedAt.
  return prisma.itemReport.update({
    where: { id: reportId },
    data: {
      status: 'REUNITED',
      reunitedAt: report.reunitedAt ?? new Date(),
      ...(reunionMethod ? { reunionMethod } : {}),
    },
    include: REPORT_INCLUDE,
  })
}

// Phase 8: Home page stats. All four numbers are real aggregates over
// the same data everything else in this file already reads/writes —
// no new tables, no denormalized counters to keep in sync.
export async function getStats() {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const [reunitedCount, totalCount, todaysReportsCount, potentialMatchesCount] =
    await Promise.all([
      prisma.itemReport.count({ where: { status: 'REUNITED' } }),
      prisma.itemReport.count(),
      prisma.itemReport.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.match.count(),
    ])

  return {
    itemsReunited: reunitedCount,
    successRate: totalCount === 0 ? 0 : Math.round((reunitedCount / totalCount) * 100),
    todaysReports: todaysReportsCount,
    potentialMatches: potentialMatchesCount,
  }
}

// ---------------- LOST reports (Phase 3A — behavior unchanged) ----------------

export function createLostReport(ownerId: string, input: CreateLostReportInput) {
  return createReport(ownerId, 'LOST', {
    title: input.title,
    description: input.description,
    category: input.category,
    location: input.location,
    eventDate: input.dateLost,
    images: input.images,
    contactName: input.contactName,
    contactPhone: input.contactPhone,
    contactEmail: input.contactEmail,
  })
}

export function getMyLostReports(ownerId: string) {
  return getMyReports(ownerId, 'LOST')
}

export function getLostReportById(reportId: string, requestingUserId: string) {
  return getReportById(reportId, requestingUserId, 'LOST')
}

export function deleteLostReport(reportId: string, requestingUserId: string) {
  return deleteReport(reportId, requestingUserId, 'LOST')
}

export function browseLostReports(query: BrowseReportsQuery) {
  return browseReports('LOST', query)
}

export function reuniteLostReport(
  reportId: string,
  requestingUserId: string,
  reunionMethod?: ReunionMethod,
) {
  return reuniteReport(reportId, requestingUserId, 'LOST', reunionMethod)
}

// ---------------- FOUND reports (Phase 3B) ----------------

export function createFoundReport(ownerId: string, input: CreateFoundReportInput) {
  return createReport(ownerId, 'FOUND', {
    title: input.title,
    description: input.description,
    category: input.category,
    location: input.location,
    eventDate: input.dateFound,
    images: input.images,
    currentLocation: input.currentLocation,
    contactName: input.contactName,
    contactPhone: input.contactPhone,
    contactEmail: input.contactEmail,
  })
}

export function getMyFoundReports(ownerId: string) {
  return getMyReports(ownerId, 'FOUND')
}

export function getFoundReportById(reportId: string, requestingUserId: string) {
  return getReportById(reportId, requestingUserId, 'FOUND')
}

export function deleteFoundReport(reportId: string, requestingUserId: string) {
  return deleteReport(reportId, requestingUserId, 'FOUND')
}

export function browseFoundReports(query: BrowseReportsQuery) {
  return browseReports('FOUND', query)
}

export function reuniteFoundReport(
  reportId: string,
  requestingUserId: string,
  reunionMethod?: ReunionMethod,
) {
  return reuniteReport(reportId, requestingUserId, 'FOUND', reunionMethod)
}
