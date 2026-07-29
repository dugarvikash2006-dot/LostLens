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

// Shared display labels — previously duplicated separately in
// ReportForm/ReportCard/ReportDetails; centralized here so Browse (and
// anything else that needs them) reuses the same copy instead of a
// fourth/fifth hand-written duplicate.
export const CATEGORY_LABELS: Record<Category, string> = {
  ELECTRONICS: 'Electronics',
  ACCESSORIES: 'Accessories',
  BAGS: 'Bags',
  DOCUMENTS: 'Documents',
  KEYS: 'Keys',
  CLOTHING: 'Clothing',
  BOOKS: 'Books',
  OTHER: 'Other',
}

export type ReportStatus =
  | 'OPEN'
  | 'POTENTIAL_MATCH'
  | 'CLAIM_PENDING'
  | 'RETURNED'
  | 'CLOSED'
  | 'REUNITED'

export const REPORT_STATUS_OPTIONS: ReportStatus[] = [
  'OPEN',
  'POTENTIAL_MATCH',
  'CLAIM_PENDING',
  'RETURNED',
  'CLOSED',
  'REUNITED',
]

export const STATUS_LABELS: Record<ReportStatus, string> = {
  OPEN: 'Open',
  POTENTIAL_MATCH: 'Potential Match',
  CLAIM_PENDING: 'Claim Pending',
  RETURNED: 'Returned',
  CLOSED: 'Closed',
  REUNITED: 'Reunited',
}

// Phase 9: a one-line, plain-language explanation of what each status
// actually means — shown next to the badge wherever a report's status
// is displayed, so "Potential Match" (etc.) never has to be guessed at.
export const STATUS_EXPLANATIONS: Record<ReportStatus, string> = {
  OPEN: 'This report is active. Lens Match compares it against new reports automatically.',
  POTENTIAL_MATCH: 'Our AI has found a similar report that may belong to you.',
  CLAIM_PENDING: 'Contact has been made about this item and a handoff is being arranged.',
  RETURNED: 'This item has been returned to its owner.',
  CLOSED: 'This report is no longer active.',
  REUNITED: 'This item has been successfully reunited with its owner.',
}

// Phase 8: optional, reporter-supplied context for how a reunion came
// about. Purely informational — never read by matching/ranking logic.
export type ReunionMethod =
  | 'AI_MATCH'
  | 'CONTACTED_ME'
  | 'MANUAL_SEARCH'
  | 'CAMPUS_SECURITY'
  | 'FRIEND'

export const REUNION_METHOD_OPTIONS: ReunionMethod[] = [
  'AI_MATCH',
  'CONTACTED_ME',
  'MANUAL_SEARCH',
  'CAMPUS_SECURITY',
  'FRIEND',
]

export const REUNION_METHOD_LABELS: Record<ReunionMethod, string> = {
  AI_MATCH: 'AI Match',
  CONTACTED_ME: 'Someone contacted me',
  MANUAL_SEARCH: 'Manual search',
  CAMPUS_SECURITY: 'Campus security',
  FRIEND: 'Friend',
}

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
  // Phase 7: where a FOUND item can currently be picked up. Always null
  // on LOST reports.
  currentLocation: string | null
  // Phase 7: optional, independently — a reporter may give only a
  // phone, only an email, both, or neither.
  contactName: string | null
  contactPhone: string | null
  contactEmail: string | null
  imageUrl: string | null
  status: ReportStatus
  // Phase 8: set once status becomes REUNITED; null until then.
  reunitedAt: string | null
  reunionMethod: ReunionMethod | null
  // Phase 8/9: when the earliest AI candidate was found for this
  // report, if ever — a real timestamp (never reveals the candidate's
  // identity), so it's safe on every viewer's response, unlike the full
  // Lens Match suggestion list which stays owner-only.
  aiMatchFoundAt: string | null
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
  contactName?: string
  contactPhone?: string
  contactEmail?: string
}

export interface CreateFoundReportRequest {
  title: string
  description: string
  category: Category
  location: string
  dateFound: string
  images?: ImageReference[]
  currentLocation?: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
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

export interface DeleteReportResponse {
  success: true
  message: string
}

export type BrowseSort = 'newest' | 'oldest'

export interface BrowseReportsParams {
  search?: string
  category?: Category
  status?: ReportStatus
  sort?: BrowseSort
}

// Same shape as MyReportsResponse — kept as a distinct alias so call
// sites (Browse) stay self-documenting about which endpoint they hit,
// same reasoning as CreateLostReportResponse/CreateFoundReportResponse.
export type BrowseReportsResponse = MyReportsResponse

// ---------------- Reunite (Phase 8) ----------------

export interface ReuniteReportResponse {
  success: true
  message: string
  data: {
    report: ItemReport
  }
}

// ---------------- Stats (Phase 8) ----------------

export interface ItemStats {
  itemsReunited: number
  successRate: number
  todaysReports: number
  potentialMatches: number
}

export interface ItemStatsResponse {
  success: true
  data: {
    stats: ItemStats
  }
}
