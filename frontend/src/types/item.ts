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

// Mirrors backend/src/middleware/upload.middleware.ts — used for
// client-side pre-checks only; the backend remains authoritative.
export const MAX_REPORT_IMAGES = 5
export const MAX_IMAGE_SIZE_MB = 5
export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// A single Cloudinary-hosted image attached to a report (Phase 3C).
export interface ReportImage {
  id: string
  reportId: string
  imageUrl: string
  publicId: string
  createdAt: string
}

// A bare image reference — what POST /api/items/upload returns, and what
// gets sent back to the backend when creating a report. Distinct from
// ReportImage (the persisted, DB-backed record with id/reportId/createdAt)
// since a reference exists before any report does.
export interface ImageReference {
  imageUrl: string
  publicId: string
}

// Matches the ItemReport Prisma model as returned by the API. Covers both
// LOST (Phase 3A) and FOUND (Phase 3B) reports — they're the same
// underlying model and shape, just filtered by reportType.
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
  images: ReportImage[]
}

export interface CreateLostReportRequest {
  title: string
  description: string
  category: Category
  location: string
  dateLost: string
  images?: ImageReference[]
}

export interface CreateFoundReportRequest {
  title: string
  description: string
  category: Category
  location: string
  dateFound: string
  images?: ImageReference[]
}

export interface UploadImagesResponse {
  success: true
  data: {
    images: ImageReference[]
  }
}


// LOST and FOUND creation responses share the same shape — only the
// request field name differs (dateLost vs dateFound), matching the
// backend. Kept as named aliases rather than one generic type so call
// sites stay self-documenting about which flow they're in.
export interface CreateReportResponse {
  success: true
  message: string
  data: {
    report: ItemReport
  }
}

export type CreateLostReportResponse = CreateReportResponse
export type CreateFoundReportResponse = CreateReportResponse

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
