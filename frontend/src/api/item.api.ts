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
} from '../types/item'

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
