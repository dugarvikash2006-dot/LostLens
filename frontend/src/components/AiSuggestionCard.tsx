import { Link } from 'react-router-dom'
import type { Suggestion } from '../types/suggestion'
import { formatReportDate } from '../utils/formatDate'
import './AiSuggestions.css'

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  POTENTIAL_MATCH: 'Potential Match',
  CLAIM_PENDING: 'Claim Pending',
  RETURNED: 'Returned',
  CLOSED: 'Closed',
}

interface AiSuggestionCardProps {
  suggestion: Suggestion
}

/**
 * A single AI-generated suggestion — a candidate report ranked by the
 * existing backend pipeline (Milestones 3A-3D). Purely presentational;
 * fetching/loading/error state lives in AiSuggestions.tsx.
 */
function AiSuggestionCard({ suggestion }: AiSuggestionCardProps) {
  const detailsPath =
    suggestion.reportType === 'LOST' ? `/items/${suggestion.reportId}` : `/found/${suggestion.reportId}`

  return (
    <div className="ai-suggestion-card card">
      <div className="ai-suggestion-thumb">
        {suggestion.thumbnail ? (
          <img src={suggestion.thumbnail} alt="" />
        ) : (
          <span className="ai-suggestion-no-image">No Image</span>
        )}
      </div>

      <div className="ai-suggestion-body">
        <div className="ai-suggestion-header">
          <span className={`badge ${suggestion.reportType === 'LOST' ? 'badge-lost' : 'badge-found'}`}>
            {suggestion.reportType === 'LOST' ? 'Lost' : 'Found'}
          </span>
          {suggestion.score !== null && (
            <span className="ai-suggestion-score">{Math.round(suggestion.score)}% match</span>
          )}
        </div>

        <h3 className="ai-suggestion-title">{suggestion.itemName}</h3>
        <p className="ai-suggestion-meta">{suggestion.category}</p>
        <p className="ai-suggestion-meta">{suggestion.location}</p>
        <p className="ai-suggestion-meta">{formatReportDate(suggestion.eventDate)}</p>

        <span className={`badge badge-status badge-status-${suggestion.status}`}>
          {STATUS_LABELS[suggestion.status] ?? suggestion.status}
        </span>

        <Link to={detailsPath} className="btn btn-secondary ai-suggestion-view-btn">
          View Report
        </Link>
      </div>
    </div>
  )
}

export default AiSuggestionCard
