import { useEffect, useState } from 'react'
import { getSuggestions } from '../api/suggestion.api'
import type { ItemReport } from '../types/item'

// Shared between My Lost Reports and My Found Reports: fetches each
// report's Lens Match results (existing suggestion.api.ts, one call per
// report, same pattern already used on the Dashboard) and reduces them
// to a single top score per report, so listing cards can show a match
// indicator without the user opening each report individually.
//
// Kept as a hook rather than duplicated inside both listing pages —
// their need here is identical (just the top score per report id),
// unlike the Dashboard, which needs the full match objects.
export function useTopMatchScores(reports: ItemReport[] | null): Record<string, number | null> {
  const [scores, setScores] = useState<Record<string, number | null>>({})

  useEffect(() => {
    // Nothing to fetch — leave prior scores as-is rather than resetting
    // synchronously in the effect body; stale entries are harmless here
    // since callers only ever look up scores by an id in the current
    // `reports` list, and an empty/missing list has nothing to look up.
    if (!reports || reports.length === 0) {
      return
    }

    let cancelled = false

    Promise.all(
      reports.map((report) =>
        getSuggestions(report.id)
          .then((suggestions): [string, number | null] => [report.id, suggestions[0]?.score ?? null])
          .catch((): [string, number | null] => [report.id, null]),
      ),
    ).then((entries) => {
      if (!cancelled) {
        setScores(Object.fromEntries(entries))
      }
    })

    return () => {
      cancelled = true
    }
  }, [reports])

  return scores
}
