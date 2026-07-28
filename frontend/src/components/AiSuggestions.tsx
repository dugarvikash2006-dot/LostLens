import { useEffect, useState } from 'react'
import { getSuggestions } from '../api/suggestion.api'
import { ApiError } from '../api/client'
import type { Suggestion } from '../types/suggestion'
import AiSuggestionCard from './AiSuggestionCard'
import './AiSuggestions.css'

interface AiSuggestionsProps {
  reportId: string
}

/**
 * Fetches and displays already-generated AI suggestions for a report.
 * Self-contained: owns its own loading/error/empty state so a backend
 * hiccup here only degrades this section, never the rest of the page.
 */
function AiSuggestions({ reportId }: AiSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

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
            : 'AI suggestions are temporarily unavailable. Please try again later.',
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

  return (
    <div className="ai-suggestions-section card">
      <h2>AI Suggestions</h2>

      {isLoading && (
        <p className="ai-suggestions-status" role="status" aria-live="polite">
          Loading suggestions…
        </p>
      )}

      {!isLoading && error && <p className="ai-suggestions-status ai-suggestions-error">{error}</p>}

      {!isLoading && !error && suggestions && suggestions.length === 0 && (
        <p className="ai-suggestions-status">No AI suggestions yet.</p>
      )}

      {!isLoading && !error && suggestions && suggestions.length > 0 && (
        <div className="ai-suggestions-grid">
          {suggestions.map((suggestion) => (
            <AiSuggestionCard key={suggestion.matchId} suggestion={suggestion} />
          ))}
        </div>
      )}
    </div>
  )
}

export default AiSuggestions
