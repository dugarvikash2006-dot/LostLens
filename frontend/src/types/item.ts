// Types mirroring the real Phase 3A backend contract exactly.
// Keep these in sync with backend/src/services/item.service.ts and
// backend/src/validators/item.validator.ts if either changes.

export type ReportType = 'LOST' | 'FOUND'

export type Category =
  | 'ELECTRONICS'
  | 'ACCESSORIES'
  | 'BAGS'
  | 'DOCUMENTS'
  | 'KEYS'
  | 'CLOTHING'
  | 'BOOKS'
  | 'OTHER'

export const CATEGORY_OPTIONS: Category[] = [
  'ELECTRONICS',
  'ACCESSORIES',
  'BAGS',
  'DOCUMENTS',
  'KEYS',
  'CLOTHING',
  'BOOKS',
  'OTHER',
]

export type ReportStatus = 'OPEN' | 'POTENTIAL_MATCH' | 'CLAIM_PENDING' | 'RETURNED' | 'CLOSED'

// Matches the ItemReport Prisma model as returned by the API — this phase
// only ever creates reportType: 'LOST', but the shape covers the whole
// model since GET endpoints return it as-is.
export interface ItemReport {
  id: string
  userId: string
  reportType: ReportType
  itemName: string
  category: Category
  brand: string | null
  color: string | null
  description: string
  distinctiveFeatures: string | null
  eventDate: string
  approximateTime: string | null
  location: string
  locationDetails: string | null
  imageUrl: string | null
  status: ReportStatus
  createdAt: string
  updatedAt: string
}

export interface CreateLostReportRequest {
  title: string
  description: string
  category: Category
  location: string
  dateLost: string
}

export interface CreateLostReportResponse {
  success: true
  message: string
  data: {
    report: ItemReport
  }
}

export interface MyReportsResponse {
  success: true
  data: {
    reports: ItemReport[]
  }
}

export interface ReportDetailsResponse {
  success: true
  data: {
    report: ItemReport
  }
}
