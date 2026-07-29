import { useCallback, useEffect, useState } from 'react'
import type { Category } from '../types/item'

export interface SavedSearch {
  id: string
  term: string
  category?: Category
  createdAt: string
}

const STORAGE_KEY = 'lostlens:savedSearches'
const MAX_SAVED_SEARCHES = 10

function readStoredSearches(): SavedSearch[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as SavedSearch[]) : []
  } catch {
    return []
  }
}

/**
 * Saved searches (Phase 9, Feature 4) — deliberately client-side only.
 * No backend table: this is a lightweight personalization feature with
 * explicitly no notification/matching logic behind it, so persisting it
 * per-browser in localStorage is enough and avoids standing up API
 * endpoints for something this small.
 */
export function useSavedSearches() {
  const [searches, setSearches] = useState<SavedSearch[]>(() => readStoredSearches())

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(searches))
  }, [searches])

  const saveSearch = useCallback((term: string, category?: Category) => {
    setSearches((current) => {
      // Replace an existing save for the same term+category instead of
      // duplicating it.
      const withoutDuplicate = current.filter(
        (search) => !(search.term === term && search.category === category),
      )
      const next: SavedSearch = {
        id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
        term,
        category,
        createdAt: new Date().toISOString(),
      }
      return [next, ...withoutDuplicate].slice(0, MAX_SAVED_SEARCHES)
    })
  }, [])

  const removeSearch = useCallback((id: string) => {
    setSearches((current) => current.filter((search) => search.id !== id))
  }, [])

  return { searches, saveSearch, removeSearch }
}
