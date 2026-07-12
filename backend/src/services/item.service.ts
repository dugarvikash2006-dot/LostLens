import { prisma } from '../config/prisma'
import { AppError } from '../utils/app-error'
import type { CreateLostReportInput, CreateFoundReportInput } from '../validators/item.validator'

// This phase only creates LOST and FOUND reports directly (no images,
// matching, claims, or notifications yet) — the underlying ItemReport
// model already supports all of that, but these services intentionally
// only exercise the plain create/list/get-by-id slice of it.
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

interface CreateReportFields {
  title: string
  description: string
  category: CategoryValue
  location: string
  eventDate: Date
}

async function createReport(ownerId: string, reportType: ReportType, input: CreateReportFields) {
  return prisma.itemReport.create({
    data: {
      userId: ownerId,
      reportType,
      itemName: input.title,
      category: input.category,
      description: input.description,
      location: input.location,
      eventDate: input.eventDate,
      // status defaults to OPEN at the schema level
    },
  })
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
  })
}

async function getReportById(reportId: string, requestingUserId: string, reportType: ReportType) {
  const report = await prisma.itemReport.findUnique({
    where: { id: reportId },
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
  })
}

export function getMyFoundReports(ownerId: string) {
  return getMyReports(ownerId, 'FOUND')
}

export function getFoundReportById(reportId: string, requestingUserId: string) {
  return getReportById(reportId, requestingUserId, 'FOUND')
}
