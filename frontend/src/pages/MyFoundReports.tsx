import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyFoundReports } from '../api/item.api'
import { ApiError } from '../api/client'
import ReportCard from '../components/ReportCard'
import type { ItemReport } from '../types/item'
import './Reports.css'

function MyFoundReports() {
  const [reports, setReports] = useState<ItemReport[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    getMyFoundReports()
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
            <h1>My Found Reports</h1>
            <p>Everything you&apos;ve reported found, newest first.</p>
          </div>
          <Link to="/create-found" className="btn btn-primary">
            Report a Found Item
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
            You haven&apos;t reported any found items yet.
          </div>
        )}

        {!isLoading && !error && reports && reports.length > 0 && (
          <div className="reports-grid">
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                to={`/found/${report.id}`}
                dateLabel="Found"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default MyFoundReports
