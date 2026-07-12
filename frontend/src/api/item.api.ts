import { apiRequest } from './client'
import { getStoredToken } from '../utils/tokenStorage'
import type {
  CreateLostReportRequest,
  CreateLostReportResponse,
  MyReportsResponse,
  ReportDetailsResponse,
} from '../types/item'

// All three endpoints require authentication. These pages only ever
// render behind ProtectedRoute, so a token should always be present —
// but if it's somehow missing, the backend will correctly reject the
// request with 401 rather than this silently sending nothing.

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
