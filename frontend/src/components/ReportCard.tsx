import { Link } from 'react-router-dom'
import type { ItemReport } from '../types/item'
import { formatReportDate } from '../utils/formatDate'
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
}

/**
 * Shared summary card used by both My Lost Reports and My Found Reports —
 * identical fields and layout, just a different link target and
 * date-line wording.
 */
function ReportCard({ report, to, dateLabel }: ReportCardProps) {
  return (
    <Link to={to} className="report-card card">
      <div className="report-card-header">
        <span className={`badge badge-status badge-status-${report.status}`}>
          {STATUS_LABELS[report.status] ?? report.status}
        </span>
      </div>
      <h3 className="report-card-title">{report.itemName}</h3>
      <p className="report-card-meta">{report.category}</p>
      <p className="report-card-meta">{report.location}</p>
      <p className="report-card-meta">
        {dateLabel} {formatReportDate(report.eventDate)}
      </p>
      <p className="report-card-meta">Reported {formatReportDate(report.createdAt)}</p>
    </Link>
  )
}

export default ReportCard
