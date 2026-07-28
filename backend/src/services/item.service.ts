import { prisma } from '../config/prisma'
import { AppError } from '../utils/app-error'
import { linkEmbeddingsToReport } from './embedding.service'
import { generateSuggestionsForReport } from './suggestion.service'
import type { CreateLostReportInput, CreateFoundReportInput } from '../validators/item.validator'

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

async function getReportById(reportId: string, requestingUserId: string, reportType: ReportType) {
  const report = await prisma.itemReport.findUnique({
    where: { id: reportId },
    include: REPORT_INCLUDE,
  })

  if (!report || report.reportType !== reportType) {
    throw new AppError(404, 'Report not found.')
  }

  if (report.userId !== requestingUserId) {
    throw new AppError(403, 'You do not have permission to view this report.')
  }

  return report
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
  })
}

export function getMyLostReports(ownerId: string) {
  return getMyReports(ownerId, 'LOST')
}

export function getLostReportById(reportId: string, requestingUserId: string) {
  return getReportById(reportId, requestingUserId, 'LOST')
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
  })
}

export function getMyFoundReports(ownerId: string) {
  return getMyReports(ownerId, 'FOUND')
}

export function getFoundReportById(reportId: string, requestingUserId: string) {
  return getReportById(reportId, requestingUserId, 'FOUND')
}
