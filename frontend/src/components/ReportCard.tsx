import { Link } from 'react-router-dom'
import type { ItemReport } from '../types/item'
import { formatReportDate } from '../utils/formatDate'
import ConfidenceRing from './ConfidenceRing'
import ObjectPortrait from './ObjectPortrait'
import '../pages/Reports.css'

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  POTENTIAL_MATCH: 'Potential Match',
  CLAIM_PENDING: 'Claim Pending',
  RETURNED: 'Returned',
  CLOSED: 'Closed',
}

interface ReportCardProps {
  report: ItemReport
  /** Where the card links to, e.g. `/items/${report.id}` or `/found/${report.id}` */
  to: string
  /** e.g. "Lost" or "Found", used as the date-line prefix */
  dateLabel: string
  /** Top Lens Match score for this report (0-100), if any — renders the
   *  confidence ring indicator directly on the card. Omit/undefined
   *  while still loading; null once loaded with no match. */
  topMatchScore?: number | null
}

/**
 * Shared, image-first summary card used by both My Lost Reports and My
 * Found Reports — identical fields and layout, just a different link
 * target and date-line wording. Reuses the same studio-frame treatment
 * (`op-frame`) as ObjectPortrait so every photo slot in the app — real
 * or placeholder — reads as one consistent visual system.
 */
function ReportCard({ report, to, dateLabel, topMatchScore }: ReportCardProps) {
  const photo = report.images[0]?.imageUrl

  return (
    <Link to={to} className="report-card card">
      <div className="report-card-photo">
        <ObjectPortrait src={photo} alt="" className="report-card-photo-frame" />
        <span className={`badge badge-status badge-status-${report.status} report-card-status`}>
          {STATUS_LABELS[report.status] ?? report.status}
        </span>
        {typeof topMatchScore === 'number' && (
          <div className="report-card-match" title="Lens Match found a candidate">
            <ConfidenceRing score={topMatchScore} size="sm" label={`${Math.round(topMatchScore)}% Lens Match`} />
          </div>
        )}
      </div>

      <div className="report-card-body">
        <h3 className="report-card-title">{report.itemName}</h3>
        <p className="report-card-meta">{report.category}</p>
        <p className="report-card-meta">{report.location}</p>
        <p className="report-card-meta">
          {dateLabel} {formatReportDate(report.eventDate)}
        </p>
      </div>
    </Link>
  )
}

export default ReportCard
