import { apiRequest } from './client'
import { getStoredToken } from '../utils/tokenStorage'
import type {
  CreateLostReportRequest,
  CreateLostReportResponse,
  CreateFoundReportRequest,
  CreateFoundReportResponse,
  MyReportsResponse,
  ReportDetailsResponse,
  UploadImagesResponse,
  DeleteReportResponse,
  BrowseReportsParams,
  BrowseReportsResponse,
  ReunionMethod,
  ReuniteReportResponse,
  ItemStatsResponse,
} from '../types/item'

// Shared by browseLostReports/browseFoundReports — turns the params
// object into a query string, omitting anything left unset rather than
// sending e.g. "category=" for an unfiltered search.
function toBrowseQueryString(params: BrowseReportsParams): string {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  if (params.category) query.set('category', params.category)
  if (params.status) query.set('status', params.status)
  if (params.sort) query.set('sort', params.sort)
  const queryString = query.toString()
  return queryString ? `?${queryString}` : ''
}

// All endpoints require authentication. These pages only ever render
// behind ProtectedRoute, so a token should always be present — but if
// it's somehow missing, the backend will correctly reject the request
// with 401 rather than this silently sending nothing.

// ---------------- Image upload (Phase 3C) ----------------

/**
 * Uploads image files to the backend (which forwards them to Cloudinary)
 * and returns their { imageUrl, publicId } references. Call this first,
 * then pass the returned references into createLostReport/createFoundReport
 * — reports are never created with raw file data directly.
 */
export function uploadImages(files: File[]): Promise<UploadImagesResponse> {
  const formData = new FormData()
  for (const file of files) {
    formData.append('images', file)
  }

  return apiRequest<UploadImagesResponse>('/api/items/upload', {
    method: 'POST',
    body: formData,
    token: getStoredToken(),
  })
}

// ---------------- LOST reports (Phase 3A — unchanged) ----------------

export function createLostReport(
  payload: CreateLostReportRequest,
): Promise<CreateLostReportResponse> {
  return apiRequest<CreateLostReportResponse>('/api/items/lost', {
    method: 'POST',
    body: payload,
    token: getStoredToken(),
  })
}

export function getMyLostReports(): Promise<MyReportsResponse> {
  return apiRequest<MyReportsResponse>('/api/items/mine', {
    method: 'GET',
    token: getStoredToken(),
  })
}

export function getLostReportById(id: string): Promise<ReportDetailsResponse> {
  return apiRequest<ReportDetailsResponse>(`/api/items/${encodeURIComponent(id)}`, {
    method: 'GET',
    token: getStoredToken(),
  })
}

export function deleteLostReport(id: string): Promise<DeleteReportResponse> {
  return apiRequest<DeleteReportResponse>(`/api/items/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token: getStoredToken(),
  })
}

export function browseLostReports(params: BrowseReportsParams): Promise<BrowseReportsResponse> {
  return apiRequest<BrowseReportsResponse>(`/api/items/browse${toBrowseQueryString(params)}`, {
    method: 'GET',
    token: getStoredToken(),
  })
}

/**
 * Marks a report REUNITED. Called once with no method to mark the
 * report reunited immediately, and optionally again later with just a
 * reunionMethod if the user answers the "how did the reunion happen?"
 * follow-up — the backend treats both calls as the same idempotent update.
 */
export function reuniteLostReport(
  id: string,
  reunionMethod?: ReunionMethod,
): Promise<ReuniteReportResponse> {
  return apiRequest<ReuniteReportResponse>(`/api/items/${encodeURIComponent(id)}/reunite`, {
    method: 'PATCH',
    body: reunionMethod ? { reunionMethod } : undefined,
    token: getStoredToken(),
  })
}

// ---------------- FOUND reports (Phase 3B) ----------------

export function createFoundReport(
  payload: CreateFoundReportRequest,
): Promise<CreateFoundReportResponse> {
  return apiRequest<CreateFoundReportResponse>('/api/items/found', {
    method: 'POST',
    body: payload,
    token: getStoredToken(),
  })
}

export function getMyFoundReports(): Promise<MyReportsResponse> {
  return apiRequest<MyReportsResponse>('/api/items/found/mine', {
    method: 'GET',
    token: getStoredToken(),
  })
}

export function getFoundReportById(id: string): Promise<ReportDetailsResponse> {
  return apiRequest<ReportDetailsResponse>(`/api/items/found/${encodeURIComponent(id)}`, {
    method: 'GET',
    token: getStoredToken(),
  })
}

export function deleteFoundReport(id: string): Promise<DeleteReportResponse> {
  return apiRequest<DeleteReportResponse>(`/api/items/found/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token: getStoredToken(),
  })
}

export function browseFoundReports(params: BrowseReportsParams): Promise<BrowseReportsResponse> {
  return apiRequest<BrowseReportsResponse>(
    `/api/items/found/browse${toBrowseQueryString(params)}`,
    {
      method: 'GET',
      token: getStoredToken(),
    },
  )
}

export function reuniteFoundReport(
  id: string,
  reunionMethod?: ReunionMethod,
): Promise<ReuniteReportResponse> {
  return apiRequest<ReuniteReportResponse>(`/api/items/found/${encodeURIComponent(id)}/reunite`, {
    method: 'PATCH',
    body: reunionMethod ? { reunionMethod } : undefined,
    token: getStoredToken(),
  })
}

// ---------------- Stats (Phase 8) ----------------

/** Public — no auth token needed or sent. Shown on the Home page to every visitor. */
export function getItemStats(): Promise<ItemStatsResponse> {
  return apiRequest<ItemStatsResponse>('/api/items/stats', { method: 'GET' })
}
