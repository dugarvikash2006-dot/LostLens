import { Link } from 'react-router-dom'
import type { ItemReport } from '../types/item'
import { formatReportDate } from '../utils/formatDate'
import ImageGallery from './ImageGallery'
import AiSuggestions from './AiSuggestions'
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
  matches: any[]
}

/**
 * Shared full-detail view used by both the Lost and Found item details
 * pages — identical layout, just different wording for the date field
 * and the back-link.
 */
function ReportDetails({ report, dateLabel, backTo, backLabel, matches, }: ReportDetailsProps) {
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

          <ImageGallery images={report.images} />
          {matches.length > 0 && (
  <div className="report-details-card card" style={{ marginTop: '1.5rem' }}>
    <h2>Possible Matches</h2>

    {matches.map((match) => (
      <Link
  key={match.reportId}
  to={
    match.reportType === 'LOST'
      ? `/items/${match.reportId}`
      : `/found/${match.reportId}`
  }
  style={{
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
  }}
>
        <div
  style={{
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  }}
>
  {match.thumbnail ? (
    <img
      src={match.thumbnail}
      alt={match.title}
      style={{
        width: '90px',
        height: '90px',
        objectFit: 'cover',
        borderRadius: '8px',
      }}
    />
  ) : (
    <div
      style={{
        width: '90px',
        height: '90px',
        borderRadius: '8px',
        background: '#eee',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      No Image
    </div>
  )}

  <div>
    <h3>{match.title}</h3>

    <p>
      <strong>Match Score:</strong> {match.score}
    </p>

    <p>
      <strong>Location:</strong> {match.location}
    </p>
  </div>
</div>


        <ul>
          {match.reasons.map((reason: string) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </Link>
    ))}
  </div>
)}

          <AiSuggestions reportId={report.id} />

          <Link to={backTo} className="btn btn-secondary report-details-back">
            {backLabel}
          </Link>
        </div>
      </div>
    </section>
  )
}

export default ReportDetails
