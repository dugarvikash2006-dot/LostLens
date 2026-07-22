import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getLostReportById } from '../api/item.api'
import { ApiError } from '../api/client'
import ReportDetails from '../components/ReportDetails'
import type { ItemReport } from '../types/item'
import './Reports.css'

function ItemDetails() {
  const { id } = useParams<{ id: string }>()

  const [report, setReport] = useState<ItemReport | null>(null)
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
  matches={[]}
  dateLabel="Date Lost"
  backTo="/my-lost"
  backLabel="Back to My Lost Reports"
/>
  )
}

export default ItemDetails
