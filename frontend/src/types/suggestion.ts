// Types mirroring the real Phase 4 backend contract exactly. Keep in
// sync with backend/src/services/suggestion.service.ts if it changes.
import type { Category, ReportStatus, ReportType } from './item'

export type MatchStatus = 'SUGGESTED' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED'

// An AI-generated suggestion: a candidate report ranked by the existing
// embedding -> similarity -> ranking pipeline (Milestones 3A-3D),
// already persisted server-side. This app never recomputes any of it.
export interface Suggestion {
  matchId: string
  reportId: string
  reportType: ReportType
  itemName: string
  category: Category
  location: string
  eventDate: string
  /** The candidate report's own status (OPEN, RETURNED, etc). */
  status: ReportStatus
  /** The suggestion's own lifecycle status (SUGGESTED/REVIEWING/ACCEPTED/REJECTED). */
  matchStatus: MatchStatus
  /** 0-100 scale, or null if not yet computed. */
  score: number | null
  thumbnail: string | null
}

export interface SuggestionsResponse {
  success: true
  data: {
    suggestions: Suggestion[]
  }
}
