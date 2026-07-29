import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { ItemReport, ReunionMethod } from '../types/item'
import { STATUS_LABELS, STATUS_EXPLANATIONS } from '../types/item'
import type { MatchResult } from '../api/matching.api'
import { ApiError } from '../api/client'
import { formatReportDate } from '../utils/formatDate'
import { useToast } from '../context/useToast'
import { LocationPinIcon, CheckIcon, ShareIcon } from './icons'
import ImageGallery from './ImageGallery'
import LensMatchResults from './LensMatchResults'
import ConfirmDialog from './ConfirmDialog'
import ReunionFeedback from './ReunionFeedback'
import './LegacyMatches.css'
import '../pages/Reports.css'

interface ReportDetailsProps {
  report: ItemReport
  /** e.g. "Date Lost" or "Date Found" */
  dateLabel: string
  /** Where "Back to My Reports" / "Back to My Found Reports" goes */
  backTo: string
  backLabel: string
  /** Results from the legacy rule-based matching endpoint (category/location/date
   *  heuristic) — kept, but deliberately secondary to Lens Match below. Only
   *  ever populated when isOwner is true (see ItemDetails/FoundReportDetails). */
  matches: MatchResult[]
  /** Whether the signed-in user owns this report. Lens Match, legacy
   *  matches, and the delete/reunite actions are all owner-only —
   *  everyone else just sees the report's own details and its contact info. */
  isOwner: boolean
  /** Deletes this report (the parent owns the API call + where to
   *  navigate afterward). Omitted entirely when isOwner is false. */
  onDelete?: () => Promise<void>
  /** Marks this report REUNITED (no argument), or — called again later —
   *  records the optional reunionMethod follow-up. The parent owns the
   *  API call and updates its own report state so this view refreshes
   *  in place. Omitted entirely when isOwner is false. */
  onReunite?: (reunionMethod?: ReunionMethod) => Promise<void>
}

interface TimelineEvent {
  key: string
  label: string
  date?: string
}

/**
 * Shared full-detail view used by both the Lost and Found item details
 * pages. Lens Match is the primary, most prominent section here — the
 * legacy rule-based matches are still shown (that data/endpoint is
 * unchanged), just visually secondary, matching the actual difference
 * in what each one is: one is the product's centerpiece, the other is
 * an older heuristic.
 */
function ReportDetails({
  report,
  dateLabel,
  backTo,
  backLabel,
  matches,
  isOwner,
  onDelete,
  onReunite,
}: ReportDetailsProps) {
  const { showToast } = useToast()
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isReuniteConfirmOpen, setIsReuniteConfirmOpen] = useState(false)
  const [isReuniting, setIsReuniting] = useState(false)
  // True for the short window right after a successful "Mark as
  // Reunited" — drives the badge's one-shot celebrate animation and the
  // optional "how did the reunion happen?" follow-up. Resets to false
  // (and stays false) once the user answers or skips it, or on a fresh
  // page load — the follow-up is only ever meant to appear once, right
  // after the action.
  const [justReunited, setJustReunited] = useState(false)

  const hasContactInfo = Boolean(
    report.contactName || report.contactPhone || report.contactEmail,
  )
  const showCurrentLocation = report.reportType === 'FOUND' && Boolean(report.currentLocation)
  const isReunited = report.status === 'REUNITED'

  const hasPhotos = report.images.length > 0

  // Phase 9: every entry carries a real timestamp already present on
  // the report — nothing here is invented. Two reports can legitimately
  // show the same date for several of these (the AI pipeline runs
  // synchronously at creation time), which is expected, not a bug.
  const timelineEvents: TimelineEvent[] = [
    { key: 'created', label: 'Report created', date: report.createdAt },
    ...(hasPhotos
      ? [{ key: 'analysed', label: 'AI analysed uploaded photos', date: report.createdAt }]
      : []),
    ...(report.aiMatchFoundAt
      ? [{ key: 'match', label: 'Potential match detected', date: report.aiMatchFoundAt }]
      : []),
    ...(hasContactInfo
      ? [{ key: 'contact', label: 'Contact information provided', date: report.createdAt }]
      : []),
    ...(isReunited
      ? [{ key: 'reunited', label: 'Marked as reunited', date: report.reunitedAt ?? undefined }]
      : []),
  ]

  const handleConfirmDelete = async () => {
    if (!onDelete) return

    setIsDeleting(true)
    try {
      await onDelete()
      showToast('Report deleted.', 'success')
      // No further state updates here — a successful delete navigates
      // away (the parent's onDelete does that), which unmounts this
      // component.
    } catch (error) {
      setIsDeleting(false)
      setIsDeleteConfirmOpen(false)
      showToast(
        error instanceof ApiError ? error.message : "Couldn't delete this report. Please try again.",
        'error',
      )
    }
  }

  const handleConfirmReunite = async () => {
    if (!onReunite) return

    setIsReuniting(true)
    try {
      await onReunite()
      setIsReuniteConfirmOpen(false)
      setJustReunited(true)
      showToast("Great! We're glad your item made it back.", 'success')
    } catch (error) {
      showToast(
        error instanceof ApiError ? error.message : "Couldn't update this report. Please try again.",
        'error',
      )
    } finally {
      setIsReuniting(false)
    }
  }

  const handleSelectReunionMethod = (method: ReunionMethod) => {
    // Optimistic dismiss — this is optional feedback, so a failure to
    // save it shouldn't resurface as something the user needs to deal with.
    setJustReunited(false)
    onReunite?.(method).catch(() => {
      /* non-critical */
    })
  }

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const handleShare = async () => {
    const url = window.location.href

    if (canNativeShare) {
      try {
        await navigator.share({ title: report.itemName, url })
        return
      } catch (error) {
        // The user closing the share sheet also rejects with
        // AbortError — that's not a failure, just do nothing.
        if (error instanceof Error && error.name === 'AbortError') return
        // Any other failure (e.g. no share targets configured) falls
        // through to the clipboard fallback below.
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      showToast('Link copied to clipboard.', 'success')
    } catch {
      showToast('Could not copy the link. You can copy it from the address bar.', 'error')
    }
  }

  return (
    <section className="report-details-section section">
      <div className="container">
        <div className="report-details-card card">
          <div className="report-details-header">
            <h1>{report.itemName}</h1>
            <span
              className={`badge badge-status badge-status-${report.status}${justReunited ? ' badge-celebrate' : ''}`}
              aria-live="polite"
            >
              {isReunited && <CheckIcon />}
              {STATUS_LABELS[report.status] ?? report.status}
            </span>
          </div>

          <p className="report-status-explanation">{STATUS_EXPLANATIONS[report.status]}</p>

          {showCurrentLocation && (
            <div className="report-current-location">
              <LocationPinIcon />
              <div>
                <p className="report-current-location-label">Pickup Location</p>
                <p className="report-current-location-value">{report.currentLocation}</p>
              </div>
            </div>
          )}

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
              <dt>{dateLabel}</dt>
              <dd>{formatReportDate(report.eventDate)}</dd>
            </div>
            <div className="report-details-field">
              <dt>Reported On</dt>
              <dd>{formatReportDate(report.createdAt)}</dd>
            </div>
          </dl>

          <div className="report-activity-history">
            <h2>Activity History</h2>
            <ol className="report-timeline">
              {timelineEvents.map((event) => (
                <li key={event.key} className="report-timeline-item">
                  <CheckIcon />
                  <span className="report-timeline-label">{event.label}</span>
                  {event.date && (
                    <span className="report-timeline-date">{formatReportDate(event.date)}</span>
                  )}
                </li>
              ))}
            </ol>
          </div>

          {justReunited && (
            <ReunionFeedback
              onSelect={handleSelectReunionMethod}
              onSkip={() => setJustReunited(false)}
            />
          )}

          <dl className="report-details-description">
            <dt>Description</dt>
            <dd>{report.description}</dd>
          </dl>

          {hasContactInfo && (
            <div className="report-details-contact">
              <h2>Contact Information</h2>
              <dl className="report-details-contact-grid">
                {report.contactName && (
                  <div className="report-details-field">
                    <dt>Name</dt>
                    <dd>{report.contactName}</dd>
                  </div>
                )}
                {report.contactPhone && (
                  <div className="report-details-field">
                    <dt>Phone</dt>
                    <dd>{report.contactPhone}</dd>
                  </div>
                )}
                {report.contactEmail && (
                  <div className="report-details-field">
                    <dt>Email</dt>
                    <dd>{report.contactEmail}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          <ImageGallery images={report.images} itemName={report.itemName} />

          {isOwner && (
            <LensMatchResults reportId={report.id} ownPhotoUrl={report.images[0]?.imageUrl} />
          )}

          {isOwner && matches.length > 0 && (
            <div className="legacy-matches">
              <h2>Other possible matches</h2>
              <p className="legacy-matches-note">
                Based on category, location, and date proximity — separate from Lens Match above.
              </p>

              <div className="legacy-matches-list">
                {matches.map((match) => (
                  <Link
                    key={match.reportId}
                    to={match.reportType === 'LOST' ? `/items/${match.reportId}` : `/found/${match.reportId}`}
                    className="legacy-match-row"
                  >
                    {match.thumbnail ? (
                      <img src={match.thumbnail} alt="" className="legacy-match-thumb" />
                    ) : (
                      <span className="legacy-match-thumb legacy-match-thumb-empty" aria-hidden="true" />
                    )}
                    <div className="legacy-match-info">
                      <h4>{match.title}</h4>
                      <p>{match.location}</p>
                    </div>
                    <span className="legacy-match-score mono">{match.score}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="report-details-actions">
            <Link to={backTo} className="btn btn-secondary">
              {backLabel}
            </Link>
            <button type="button" className="btn btn-secondary" onClick={handleShare}>
              <ShareIcon /> {canNativeShare ? 'Share Report' : 'Copy Link'}
            </button>
            {isOwner && onReunite && !isReunited && (
              <button
                type="button"
                className="btn btn-success"
                onClick={() => setIsReuniteConfirmOpen(true)}
              >
                <CheckIcon /> Mark as Reunited
              </button>
            )}
            {isOwner && onDelete && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setIsDeleteConfirmOpen(true)}
              >
                Delete Report
              </button>
            )}
          </div>
        </div>
      </div>

      {isDeleteConfirmOpen && (
        <ConfirmDialog
          title="Delete this report?"
          description="This action cannot be undone."
          confirmLabel="Delete Report"
          tone="danger"
          isConfirming={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsDeleteConfirmOpen(false)}
        />
      )}

      {isReuniteConfirmOpen && (
        <ConfirmDialog
          title="Have you successfully recovered this item?"
          description="This marks the report as reunited and shares it in the app's success stats."
          confirmLabel="Mark as Reunited"
          isConfirming={isReuniting}
          onConfirm={handleConfirmReunite}
          onCancel={() => setIsReuniteConfirmOpen(false)}
        />
      )}
    </section>
  )
}

export default ReportDetails
