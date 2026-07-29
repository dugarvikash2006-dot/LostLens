import { Link } from 'react-router-dom'
import type { ItemReport } from '../types/item'
import type { MatchResult } from '../api/matching.api'
import { formatReportDate } from '../utils/formatDate'
import ImageGallery from './ImageGallery'
import LensMatchResults from './LensMatchResults'
import './LegacyMatches.css'
import '../pages/Reports.css'

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  POTENTIAL_MATCH: 'Potential Match',
  CLAIM_PENDING: 'Claim Pending',
  RETURNED: 'Returned',
  CLOSED: 'Closed',
}

interface ReportDetailsProps {
  report: ItemReport
  /** e.g. "Date Lost" or "Date Found" */
  dateLabel: string
  /** Where "Back to My Reports" / "Back to My Found Reports" goes */
  backTo: string
  backLabel: string
  /** Results from the legacy rule-based matching endpoint (category/location/date
   *  heuristic) — kept, but deliberately secondary to Lens Match below. */
  matches: MatchResult[]
}

/**
 * Shared full-detail view used by both the Lost and Found item details
 * pages. Lens Match is the primary, most prominent section here — the
 * legacy rule-based matches are still shown (that data/endpoint is
 * unchanged), just visually secondary, matching the actual difference
 * in what each one is: one is the product's centerpiece, the other is
 * an older heuristic.
 */
function ReportDetails({ report, dateLabel, backTo, backLabel, matches }: ReportDetailsProps) {
  return (
    <section className="report-details-section section">
      <div className="container">
        <div className="report-details-card card">
          <div className="report-details-header">
            <h1>{report.itemName}</h1>
            <span className={`badge badge-status badge-status-${report.status}`}>
              {STATUS_LABELS[report.status] ?? report.status}
            </span>
          </div>

          <dl className="report-details-grid">
            <div className="report-details-field">
              <dt>Category</dt>
              <dd>{report.category}</dd>
            </div>
            <div className="report-details-field">
              <dt>Location</dt>
              <dd>{report.location}</dd>
            </div>
            <div className="report-details-field">
              <dt>{dateLabel}</dt>
              <dd>{formatReportDate(report.eventDate)}</dd>
            </div>
            <div className="report-details-field">
              <dt>Reported On</dt>
              <dd>{formatReportDate(report.createdAt)}</dd>
            </div>
          </dl>

          <dl className="report-details-description">
            <dt>Description</dt>
            <dd>{report.description}</dd>
          </dl>

          <ImageGallery images={report.images} itemName={report.itemName} />

          <LensMatchResults reportId={report.id} ownPhotoUrl={report.images[0]?.imageUrl} />

          {matches.length > 0 && (
            <div className="legacy-matches">
              <h2>Other possible matches</h2>
              <p className="legacy-matches-note">
                Based on category, location, and date proximity — separate from Lens Match above.
              </p>

              <div className="legacy-matches-list">
                {matches.map((match) => (
                  <Link
                    key={match.reportId}
                    to={match.reportType === 'LOST' ? `/items/${match.reportId}` : `/found/${match.reportId}`}
                    className="legacy-match-row"
                  >
                    {match.thumbnail ? (
                      <img src={match.thumbnail} alt="" className="legacy-match-thumb" />
                    ) : (
                      <span className="legacy-match-thumb legacy-match-thumb-empty" aria-hidden="true" />
                    )}
                    <div className="legacy-match-info">
                      <h4>{match.title}</h4>
                      <p>{match.location}</p>
                    </div>
                    <span className="legacy-match-score mono">{match.score}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Link to={backTo} className="btn btn-secondary report-details-back">
            {backLabel}
          </Link>
        </div>
      </div>
    </section>
  )
}

export default ReportDetails
