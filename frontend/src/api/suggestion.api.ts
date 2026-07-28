import { apiRequest } from './client'
import { getStoredToken } from '../utils/tokenStorage'
import type { SuggestionsResponse } from '../types/suggestion'

/**
 * Fetches already-generated AI suggestions for a report the caller
 * owns. Read-only — the backend never recomputes anything here.
 */
export async function getSuggestions(reportId: string) {
  const response = await apiRequest<SuggestionsResponse>(
    `/api/suggestions/${encodeURIComponent(reportId)}`,
    { token: getStoredToken() },
  )

  return response.data.suggestions
}
