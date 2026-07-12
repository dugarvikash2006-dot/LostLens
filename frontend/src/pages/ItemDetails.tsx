import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getLostReportById } from '../api/item.api'
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
    <section className="report-details-section section">
      <div className="container">
        <div className="report-details-card card">
          <div className="report-details-header">
            <h1>{report.itemName}</h1>
            <span className={`badge badge-status badge-status-${report.status}`}>
              {STATUS_LABELS[report.status] ?? report.status}
            </span>
          </div>

          <dl className="report-details-grid">
            <div className="report-details-field">
              <dt>Category</dt>
              <dd>{report.category}</dd>
            </div>
            <div className="report-details-field">
              <dt>Location</dt>
              <dd>{report.location}</dd>
            </div>
            <div className="report-details-field">
              <dt>Date Lost</dt>
              <dd>{formatDate(report.eventDate)}</dd>
            </div>
            <div className="report-details-field">
              <dt>Reported On</dt>
              <dd>{formatDate(report.createdAt)}</dd>
            </div>
          </dl>

          <dl className="report-details-description">
            <dt>Description</dt>
            <dd>{report.description}</dd>
          </dl>

          <Link to="/my-reports" className="btn btn-secondary report-details-back">
            Back to My Reports
          </Link>
        </div>
      </div>
    </section>
  )
}

export default ItemDetails
