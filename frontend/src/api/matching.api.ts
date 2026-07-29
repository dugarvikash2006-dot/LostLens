import { apiRequest } from './client'
import { getStoredToken } from '../utils/tokenStorage'
import type { ReportType } from '../types/item'

export interface MatchResult {
  reportId: string
  reportType: ReportType
  title: string
  category: string
  location: string
  eventDate: string
  thumbnail: string | null
  score: number
  reasons: string[]
}

interface MatchesResponse {
  success: boolean
  matches: MatchResult[]
}

export async function getMatches(reportId: string) {
  const response = await apiRequest<MatchesResponse>(
    `/api/matching/${reportId}`,
    { token: getStoredToken() },
  )

  return response.matches
}