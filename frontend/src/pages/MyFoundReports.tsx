import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyFoundReports } from '../api/item.api'
import { ApiError } from '../api/client'
import ReportCard from '../components/ReportCard'
import ReportCardSkeleton from '../components/ReportCardSkeleton'
import StateMessage from '../components/StateMessage'
import { AlertIcon, EmptyBoxIcon } from '../components/icons'
import { useTopMatchScores } from '../hooks/useTopMatchScores'
import type { ItemReport } from '../types/item'
import './Reports.css'

function MyFoundReports() {
  const [reports, setReports] = useState<ItemReport[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const topMatchScores = useTopMatchScores(reports)

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
          <>
            <div className="reports-grid" aria-hidden="true">
              <ReportCardSkeleton />
              <ReportCardSkeleton />
              <ReportCardSkeleton />
            </div>
            <p className="visually-hidden" role="status" aria-live="polite">
              Loading your reports…
            </p>
          </>
        )}

        {!isLoading && error && (
          <StateMessage
            icon={<AlertIcon />}
            tone="error"
            heading="Couldn't load your reports"
            description={error}
            headingLevel="h2"
          />
        )}

        {!isLoading && !error && reports && reports.length === 0 && (
          <StateMessage
            icon={<EmptyBoxIcon />}
            heading="No found reports yet"
            description="When you report something found, Lens Match starts checking it against open lost reports automatically."
            action={
              <Link to="/create-found" className="btn btn-primary">
                Report a Found Item
              </Link>
            }
            headingLevel="h2"
          />
        )}

        {!isLoading && !error && reports && reports.length > 0 && (
          <div className="reports-grid">
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                to={`/found/${report.id}`}
                dateLabel="Found"
                topMatchScore={topMatchScores[report.id]}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default MyFoundReports
