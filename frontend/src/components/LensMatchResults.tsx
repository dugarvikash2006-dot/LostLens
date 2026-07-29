import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSuggestions } from '../api/suggestion.api'
import { ApiError } from '../api/client'
import type { Suggestion } from '../types/suggestion'
import LensMatchMark from './LensMatchMark'
import LensMatchComparisonCard from './LensMatchComparisonCard'
import ConfidenceRing from './ConfidenceRing'
import './LensMatchResults.css'

interface LensMatchResultsProps {
  reportId: string
  /** The viewer's own report photo, if any — passed through to the comparison card. */
  ownPhotoUrl?: string
}

/**
 * The Lens Match Experience — this report's AI-generated candidates,
 * read-only from the existing suggestion.api.ts (Milestones 3A-3D).
 * Self-contained: owns its own loading/error/empty state so a backend
 * hiccup here only degrades this section, never the rest of the page
 * (the report's own details render regardless).
 *
 * The top-ranked candidate gets the full side-by-side comparison
 * treatment (LensMatchComparisonCard); any additional candidates are
 * listed compactly below, reusing the same .lens-match-row the
 * Dashboard uses rather than a second bespoke row implementation.
 */
function LensMatchResults({ reportId, ownPhotoUrl }: LensMatchResultsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    getSuggestions(reportId)
      .then((result) => {
        if (!cancelled) {
          setSuggestions(result)
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(
          err instanceof ApiError
            ? err.message
            : 'We couldn’t load match results for this report. Your report itself is unaffected.',
        )
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [reportId])

  const [topMatch, ...otherMatches] = suggestions ?? []

  return (
    <section className="lens-match-experience">
      <div className="lens-match-experience-head">
        <LensMatchMark />
      </div>

      {isLoading && (
        <>
          <div className="lens-match-skeleton" aria-hidden="true">
            <div className="skeleton lens-match-skeleton-photo" />
            <div className="skeleton lens-match-skeleton-ring" />
            <div className="skeleton lens-match-skeleton-photo" />
          </div>
          <p className="visually-hidden" role="status" aria-live="polite">
            Checking for Lens Match results…
          </p>
        </>
      )}

      {!isLoading && error && (
        <div className="lens-match-state lens-match-state-error" role="alert">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 9v4m0 3.5h.01M10.3 3.9 2.6 17.3A1.8 1.8 0 0 0 4.2 20h15.6a1.8 1.8 0 0 0 1.6-2.7L13.7 3.9a1.8 1.8 0 0 0-3.4 0Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
          <div>
            <h3>Lens Match is temporarily unavailable</h3>
            <p>{error}</p>
          </div>
        </div>
      )}

      {!isLoading && !error && suggestions && suggestions.length === 0 && (
        <div className="lens-match-state">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
            <path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <div>
            <h3>No matches yet</h3>
            <p>
              Lens Match checks automatically every time a new report is added — we&apos;ll
              show results here the moment one turns up.
            </p>
          </div>
        </div>
      )}

      {!isLoading && !error && topMatch && (
        <>
          <LensMatchComparisonCard suggestion={topMatch} ownPhotoUrl={ownPhotoUrl} />

          {otherMatches.length > 0 && (
            <div className="lens-match-other">
              <h3 className="lens-match-other-heading">Other possible matches</h3>
              <div className="lens-match-other-list">
                {otherMatches.map((suggestion) => (
                  <Link
                    key={suggestion.matchId}
                    to={
                      suggestion.reportType === 'LOST'
                        ? `/items/${suggestion.reportId}`
                        : `/found/${suggestion.reportId}`
                    }
                    className="lens-match-row"
                  >
                    <div>
                      <h3>{suggestion.itemName}</h3>
                      <p>
                        {suggestion.category} · {suggestion.location}
                      </p>
                    </div>
                    {suggestion.score !== null && <ConfidenceRing score={suggestion.score} size="sm" />}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default LensMatchResults
