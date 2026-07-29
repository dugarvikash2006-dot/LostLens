import { Link } from 'react-router-dom'
import type { Suggestion } from '../types/suggestion'
import ObjectPortrait from './ObjectPortrait'
import ConfidenceRing from './ConfidenceRing'
import { formatReportDate } from '../utils/formatDate'
import './LensMatchResults.css'

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  POTENTIAL_MATCH: 'Potential Match',
  CLAIM_PENDING: 'Claim Pending',
  RETURNED: 'Returned',
  CLOSED: 'Closed',
}

interface LensMatchComparisonCardProps {
  suggestion: Suggestion
  /** The viewer's own report photo, if any — shown on the left side of the comparison. */
  ownPhotoUrl?: string
}

/**
 * The hero of the Lens Match Experience: the viewer's own report photo
 * and the top candidate's photo, side by side, bridged by the
 * confidence ring — the app's signature visual, reused exactly as
 * built for the Dashboard and listing cards. Both photo slots reuse
 * ObjectPortrait so a missing photo on either side renders the same
 * consistent neutral placeholder rather than a one-off treatment.
 */
function LensMatchComparisonCard({ suggestion, ownPhotoUrl }: LensMatchComparisonCardProps) {
  const detailsPath =
    suggestion.reportType === 'LOST' ? `/items/${suggestion.reportId}` : `/found/${suggestion.reportId}`

  return (
    <div className="lens-match-comparison card">
      <div className="lens-match-comparison-photos">
        <ObjectPortrait src={ownPhotoUrl} alt="Your report" className="lens-match-comparison-photo" />

        <div className="lens-match-comparison-ring">
          <span className="lens-match-comparison-line" aria-hidden="true" />
          {suggestion.score !== null && (
            <ConfidenceRing
              score={suggestion.score}
              size="lg"
              label={`${Math.round(suggestion.score)}% Lens Match confidence`}
            />
          )}
          <span className="lens-match-comparison-line" aria-hidden="true" />
        </div>

        <ObjectPortrait
          src={suggestion.thumbnail ?? undefined}
          alt={suggestion.itemName}
          className="lens-match-comparison-photo"
        />
      </div>

      <div className="lens-match-comparison-info">
        <div>
          <span className={`badge ${suggestion.reportType === 'LOST' ? 'badge-lost' : 'badge-found'}`}>
            {suggestion.reportType === 'LOST' ? 'Lost' : 'Found'}
          </span>
          <h3>{suggestion.itemName}</h3>
          <p>
            {suggestion.category} · {suggestion.location} · {formatReportDate(suggestion.eventDate)}
          </p>
        </div>

        <div className="lens-match-comparison-actions">
          <span className={`badge badge-status badge-status-${suggestion.status}`}>
            {STATUS_LABELS[suggestion.status] ?? suggestion.status}
          </span>
          <Link to={detailsPath} className="btn btn-primary">
            View report
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LensMatchComparisonCard
