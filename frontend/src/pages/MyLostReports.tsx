import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyLostReports } from '../api/item.api'
import { ApiError } from '../api/client'
import type { ItemReport } from '../types/item'
import './Reports.css'

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  POTENTIAL_MATCH: 'Potential Match',
  CLAIM_PENDING: 'Claim Pending',
  RETURNED: 'Returned',
  CLOSED: 'Closed',
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function MyLostReports() {
  const [reports, setReports] = useState<ItemReport[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    getMyLostReports()
      .then((response) => {
        if (!cancelled) {
          setReports(response.data.reports)
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="reports-section section">
      <div className="container">
        <div className="reports-header">
          <div>
            <h1>My Lost Reports</h1>
            <p>Everything you&apos;ve reported lost, newest first.</p>
          </div>
          <Link to="/create-lost" className="btn btn-primary">
            Report a Lost Item
          </Link>
        </div>

        {isLoading && (
          <div className="reports-state" role="status" aria-live="polite">
            Loading your reports…
          </div>
        )}

        {!isLoading && error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        {!isLoading && !error && reports && reports.length === 0 && (
          <div className="reports-state">
            You haven&apos;t reported any lost items yet.
          </div>
        )}

        {!isLoading && !error && reports && reports.length > 0 && (
          <div className="reports-grid">
            {reports.map((report) => (
              <Link to={`/items/${report.id}`} className="report-card card" key={report.id}>
                <div className="report-card-header">
                  <span className={`badge badge-status badge-status-${report.status}`}>
                    {STATUS_LABELS[report.status] ?? report.status}
                  </span>
                </div>
                <h3 className="report-card-title">{report.itemName}</h3>
                <p className="report-card-meta">{report.category}</p>
                <p className="report-card-meta">{report.location}</p>
                <p className="report-card-meta">Lost {formatDate(report.eventDate)}</p>
                <p className="report-card-meta">Reported {formatDate(report.createdAt)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default MyLostReports
