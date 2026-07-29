import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getFoundReportById, deleteFoundReport, reuniteFoundReport } from '../api/item.api'
import { getMatches } from '../api/matching.api'
import type { MatchResult } from '../api/matching.api'
import { ApiError } from '../api/client'
import { useAuth } from '../context/useAuth'
import ReportDetails from '../components/ReportDetails'
import ReportDetailsSkeleton from '../components/ReportDetailsSkeleton'
import StateMessage from '../components/StateMessage'
import { AlertIcon } from '../components/icons'
import type { ItemReport } from '../types/item'
import './Reports.css'

function FoundReportDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

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
        if (cancelled) return
        setReport(response.data.report)

        // Legacy matches are owner-only on the backend — only fetch
        // them when this viewer actually is the owner, rather than
        // making a request that's guaranteed to 403 for anyone else.
        // Kept isolated from the report fetch above: a legacy-matching
        // hiccup should never look like "this report failed to load"
        // when the report itself loaded fine.
        if (response.data.report.userId === user?.id) {
          try {
            const matchResults = await getMatches(response.data.report.id)
            if (!cancelled) {
              setMatches(matchResults)
            }
          } catch {
            // Non-critical — the report still displays with no legacy matches.
          }
        }
      } catch (err) {
        if (cancelled) return
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
  }, [id, user?.id])

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
          <Link to="/my-found" className="btn btn-secondary report-details-back">
            Back to My Found Reports
          </Link>
        </div>
      </section>
    )
  }

  const isOwner = report.userId === user?.id

  return (
    <ReportDetails
      report={report}
      matches={matches}
      dateLabel="Date Found"
      backTo="/my-found"
      backLabel="Back to My Found Reports"
      isOwner={isOwner}
      onDelete={
        isOwner
          ? async () => {
              await deleteFoundReport(report.id)
              navigate('/my-found', { replace: true })
            }
          : undefined
      }
      onReunite={
        isOwner
          ? async (reunionMethod) => {
              const response = await reuniteFoundReport(report.id, reunionMethod)
              setReport(response.data.report)
            }
          : undefined
      }
    />
  )
}

export default FoundReportDetails
