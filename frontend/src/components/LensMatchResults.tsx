import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSuggestions } from '../api/suggestion.api'
import { ApiError } from '../api/client'
import type { Suggestion } from '../types/suggestion'
import LensMatchMark from './LensMatchMark'
import LensMatchComparisonCard from './LensMatchComparisonCard'
import ConfidenceRing from './ConfidenceRing'
import StateMessage from './StateMessage'
import { AlertIcon, SearchIcon } from './icons'
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
        <h2>
          <LensMatchMark />
        </h2>
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
        <StateMessage
          icon={<AlertIcon />}
          tone="error"
          heading="Lens Match is temporarily unavailable"
          description={error}
        />
      )}

      {!isLoading && !error && suggestions && suggestions.length === 0 && (
        <StateMessage
          icon={<SearchIcon />}
          heading="No matches yet"
          description="Lens Match checks automatically every time a new report is added — we'll show results here the moment one turns up."
        />
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
