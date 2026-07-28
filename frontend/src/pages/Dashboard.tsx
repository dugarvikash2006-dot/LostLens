import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { getMyLostReports, getMyFoundReports } from '../api/item.api'
import { getSuggestions } from '../api/suggestion.api'
import { ApiError } from '../api/client'
import ConfidenceRing from '../components/ConfidenceRing'
import LensMatchMark from '../components/LensMatchMark'
import type { ItemReport } from '../types/item'
import type { Suggestion } from '../types/suggestion'
import { formatReportDate } from '../utils/formatDate'
import './Dashboard.css'

// The landing view after login (Phase 5 redesign). Deliberately not an
// analytics dashboard — no charts or KPI tiles. Reuses only existing
// APIs: item.api.ts for the user's own reports, suggestion.api.ts for
// Lens Match results (called once per report, client-side, since there
// is no aggregate "all my matches" endpoint — introducing one would be
// backend work, which this phase does not touch).

interface RecentMatch extends Suggestion {
  sourceReportId: string
  sourceReportName: string
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  POTENTIAL_MATCH: 'Potential Match',
  CLAIM_PENDING: 'Claim Pending',
  RETURNED: 'Returned',
  CLOSED: 'Closed',
}

function Dashboard() {
  const { user } = useAuth()
  const firstName = user?.fullName.trim().split(/\s+/)[0] ?? ''

  const [reports, setReports] = useState<ItemReport[] | null>(null)
  const [matches, setMatches] = useState<RecentMatch[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [lost, found] = await Promise.all([getMyLostReports(), getMyFoundReports()])
        if (cancelled) return

        const allReports = [...lost.data.reports, ...found.data.reports].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        setReports(allReports)

        // Lens Match results are per-report — fetched for each of the
        // user's reports and combined here, client-side, rather than
        // requiring a new backend endpoint.
        const perReport = await Promise.all(
          allReports.map((report) =>
            getSuggestions(report.id)
              .then((suggestions) =>
                suggestions.map((s) => ({ ...s, sourceReportId: report.id, sourceReportName: report.itemName })),
              )
              .catch(() => [] as RecentMatch[]),
          ),
        )
        if (cancelled) return

        const flattened = perReport
          .flat()
          .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
          .slice(0, 3)
        setMatches(flattened)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const activeReports = (reports ?? []).filter((r) => r.status !== 'RETURNED' && r.status !== 'CLOSED').slice(0, 3)

  return (
    <section className="section-tight dashboard-section">
      <div className="container">
        <h1 className="dashboard-greeting">Welcome back, {firstName}</h1>

        <div className="dashboard-top">
          <div className="lens-match-panel card">
            <div className="lens-match-panel-head">
              <LensMatchMark />
              {matches.length > 0 && <span className="badge badge-found">{matches.length} new</span>}
            </div>

            {isLoading && (
              <p className="dashboard-status" role="status" aria-live="polite">
                Checking for new matches…
              </p>
            )}

            {!isLoading && error && <p className="dashboard-status dashboard-status-error">{error}</p>}

            {!isLoading && !error && matches.length === 0 && (
              <p className="dashboard-status">
                No matches yet — Lens Match checks automatically every time you or someone
                else adds a report.
              </p>
            )}

            {!isLoading && !error && matches.length > 0 && (
              <div className="dashboard-match-list">
                {matches.map((match) => (
                  <Link
                    key={match.matchId}
                    to={match.reportType === 'LOST' ? `/items/${match.reportId}` : `/found/${match.reportId}`}
                    className="dashboard-match-row"
                  >
                    <div>
                      <h3>{match.itemName}</h3>
                      <p>
                        {match.category} · {match.location}
                      </p>
                    </div>
                    {match.score !== null && <ConfidenceRing score={match.score} size="sm" />}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="dashboard-actions">
            <Link to="/create-lost" className="btn btn-primary btn-lg btn-block">
              + Report lost item
            </Link>
            <Link to="/create-found" className="btn btn-secondary btn-lg btn-block">
              + Report found item
            </Link>
          </div>
        </div>

        <div className="dashboard-bottom">
          <div>
            <h2 className="dashboard-subheading">My active reports</h2>

            {isLoading && (
              <p className="dashboard-status" role="status" aria-live="polite">
                Loading your reports…
              </p>
            )}

            {!isLoading && !error && activeReports.length === 0 && (
              <p className="dashboard-status">You don&apos;t have any active reports.</p>
            )}

            {!isLoading && !error && activeReports.length > 0 && (
              <div className="dashboard-report-grid">
                {activeReports.map((report) => (
                  <Link
                    key={report.id}
                    to={report.reportType === 'LOST' ? `/items/${report.id}` : `/found/${report.id}`}
                    className="dashboard-report-card card"
                  >
                    <span className={`badge ${report.reportType === 'LOST' ? 'badge-lost' : 'badge-found'}`}>
                      {report.reportType === 'LOST' ? 'Lost' : 'Found'}
                    </span>
                    <h3>{report.itemName}</h3>
                    <p>
                      {STATUS_LABELS[report.status] ?? report.status} · {formatReportDate(report.createdAt)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="card dashboard-activity">
            <h2 className="dashboard-subheading">Recent activity</h2>
            {!isLoading && !error && (reports ?? []).length === 0 && (
              <p className="dashboard-status">Nothing yet — create your first report to get started.</p>
            )}
            <ul className="dashboard-activity-list">
              {(reports ?? []).slice(0, 4).map((report) => (
                <li key={report.id}>
                  You reported <strong>{report.itemName}</strong> as {report.reportType === 'LOST' ? 'lost' : 'found'}
                  <span className="mono dashboard-activity-time"> · {formatReportDate(report.createdAt)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Dashboard
