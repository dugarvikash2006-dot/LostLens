import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getLostReportById } from '../api/item.api'
import { getMatches } from '../api/matching.api'
import type { MatchResult } from '../api/matching.api'
import { ApiError } from '../api/client'
import ReportDetails from '../components/ReportDetails'
import ReportDetailsSkeleton from '../components/ReportDetailsSkeleton'
import StateMessage from '../components/StateMessage'
import { AlertIcon } from '../components/icons'
import type { ItemReport } from '../types/item'
import './Reports.css'

function ItemDetails() {
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
        const response = await getLostReportById(id)
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
          <ReportDetailsSkeleton />
          <p className="visually-hidden" role="status" aria-live="polite">
            Loading report…
          </p>
        </div>
      </section>
    )
  }

  if (error || !report) {
    return (
      <section className="report-details-section section">
        <div className="container">
          <StateMessage
            icon={<AlertIcon />}
            tone="error"
            heading="Couldn't load this report"
            description={error ?? 'Report not found.'}
            headingLevel="h2"
          />
          <Link to="/my-reports" className="btn btn-secondary report-details-back">
            Back to My Reports
          </Link>
        </div>
      </section>
    )
  }

  return (
    <ReportDetails
      report={report}
      matches={matches}
      dateLabel="Date Lost"
      backTo="/my-reports"
      backLabel="Back to My Lost Reports"
    />
  )
}

export default ItemDetails
