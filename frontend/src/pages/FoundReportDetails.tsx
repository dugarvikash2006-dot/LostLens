import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getFoundReportById } from '../api/item.api'
import { getMatches } from '../api/matching.api'
import type { MatchResult } from '../api/matching.api'
import { ApiError } from '../api/client'
import ReportDetails from '../components/ReportDetails'
import type { ItemReport } from '../types/item'
import './Reports.css'

function FoundReportDetails() {
  const { id } = useParams<{ id: string }>()

  const [report, setReport] = useState<ItemReport | null>(null)
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadReport = async () => {
      if (!id) {
        setError('No report specified.')
        return
      }

      try {
        const response = await getFoundReportById(id)
        if (!cancelled) {
          setReport(response.data.report)
        }

        // Kept isolated from the report fetch above: a legacy-matching
        // hiccup should never look like "this report failed to load"
        // when the report itself loaded fine.
        try {
          const matchResults = await getMatches(response.data.report.id)
          if (!cancelled) {
            setMatches(matchResults)
          }
        } catch {
          // Non-critical — the report still displays with no legacy matches.
        }
      } catch (err) {
        if (cancelled) return
        // Covers 403 (not the owner) and 404 (doesn't exist) alike —
        // the backend's message is safe to show directly either way.
        setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
      }
    }

    loadReport().finally(() => {
      if (!cancelled) {
        setIsLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [id])

  if (isLoading) {
    return (
      <section className="report-details-section section">
        <div className="container">
          <div className="reports-state" role="status" aria-live="polite">
            Loading report…
          </div>
        </div>
      </section>
    )
  }

  if (error || !report) {
    return (
      <section className="report-details-section section">
        <div className="container">
          <div className="auth-error" role="alert">
            {error ?? 'Report not found.'}
          </div>
          <Link to="/my-found" className="btn btn-secondary report-details-back">
            Back to My Found Reports
          </Link>
        </div>
      </section>
    )
  }

  return (
    <ReportDetails
      report={report}
      matches={matches}
      dateLabel="Date Found"
      backTo="/my-found"
      backLabel="Back to My Found Reports"
    />
  )
}

export default FoundReportDetails
