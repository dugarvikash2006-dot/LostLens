import { prisma } from '../config/prisma'
import { AppError } from '../utils/app-error'
import type { CreateLostReportInput } from '../validators/item.validator'

// This phase only creates LOST reports. FOUND reports, images, matching,
// claims, and notifications are all out of scope here — the underlying
// ItemReport model already supports them, but this service intentionally
// only exercises the LOST-report slice of it.

export async function createLostReport(ownerId: string, input: CreateLostReportInput) {
  return prisma.itemReport.create({
    data: {
      userId: ownerId,
      reportType: 'LOST',
      itemName: input.title,
      category: input.category,
      description: input.description,
      location: input.location,
      eventDate: input.dateLost,
      // status defaults to OPEN at the schema level
    },
  })
}

export async function getMyLostReports(ownerId: string) {
  return prisma.itemReport.findMany({
    where: {
      userId: ownerId,
      reportType: 'LOST',
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export async function getLostReportById(reportId: string, requestingUserId: string) {
  const report = await prisma.itemReport.findUnique({
    where: { id: reportId },
  })

  if (!report || report.reportType !== 'LOST') {
    throw new AppError(404, 'Report not found.')
  }

  if (report.userId !== requestingUserId) {
    throw new AppError(403, 'You do not have permission to view this report.')
  }

  return report
}
