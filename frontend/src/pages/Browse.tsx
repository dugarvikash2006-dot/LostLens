import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { browseLostReports, browseFoundReports } from '../api/item.api'
import { ApiError } from '../api/client'
import ReportCard from '../components/ReportCard'
import ReportCardSkeleton from '../components/ReportCardSkeleton'
import StateMessage from '../components/StateMessage'
import { AlertIcon, SearchIcon, EmptyBoxIcon, BookmarkIcon } from '../components/icons'
import { useTopMatchScores } from '../hooks/useTopMatchScores'
import { useSavedSearches } from '../hooks/useSavedSearches'
import { CATEGORY_OPTIONS, CATEGORY_LABELS } from '../types/item'
import type { Category, ItemReport, BrowseSort } from '../types/item'
import './Browse.css'
import './Auth.css'
import './Reports.css'

const SEARCH_DEBOUNCE_MS = 350

type BrowseView = 'ALL' | 'LOST' | 'FOUND' | 'REUNITED'

const TABS: { view: BrowseView; label: string }[] = [
  { view: 'ALL', label: 'All' },
  { view: 'LOST', label: 'Lost' },
  { view: 'FOUND', label: 'Found' },
  { view: 'REUNITED', label: 'Reunited' },
]

const EMPTY_HEADING: Record<BrowseView, string> = {
  ALL: 'No reports yet.',
  LOST: 'No lost items yet.',
  FOUND: 'No found items yet.',
  REUNITED: 'No reunited reports yet.',
}

const EMPTY_DESCRIPTION: Record<BrowseView, string> = {
  ALL: 'Be the first to report a lost or found item.',
  LOST: 'Be the first to report something lost.',
  FOUND: 'Be the first to report something found.',
  REUNITED: 'Once a report is marked reunited, it shows up here.',
}

const EMPTY_ACTION: Record<BrowseView, ReactNode> = {
  ALL: (
    <Link to="/create-lost" className="btn btn-secondary">
      Create a Report
    </Link>
  ),
  LOST: (
    <Link to="/create-lost" className="btn btn-secondary">
      Report a Lost Item
    </Link>
  ),
  FOUND: (
    <Link to="/create-found" className="btn btn-secondary">
      Report a Found Item
    </Link>
  ),
  REUNITED: undefined,
}

function Browse() {
  const [activeView, setActiveView] = useState<BrowseView>('ALL')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [sort, setSort] = useState<BrowseSort>('newest')

  const [reports, setReports] = useState<ItemReport[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const topMatchScores = useTopMatchScores(reports)
  const { searches: savedSearches, saveSearch, removeSearch } = useSavedSearches()

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Debounce the free-text search so every keystroke doesn't trigger a
  // request — only the value the user has settled on for a moment.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    let cancelled = false

    const params = {
      search: debouncedSearch || undefined,
      category: category || undefined,
      // Reunited reports are hidden by default (see item.service.ts) —
      // the "Reunited" view explicitly asks for them; every other view
      // relies on that default rather than filtering client-side.
      status: activeView === 'REUNITED' ? ('REUNITED' as const) : undefined,
      sort,
    }

    const fetchReports = async (): Promise<ItemReport[]> => {
      if (activeView === 'LOST') return (await browseLostReports(params)).data.reports
      if (activeView === 'FOUND') return (await browseFoundReports(params)).data.reports

      // ALL and REUNITED span both report types — the backend keeps
      // LOST/FOUND as separate endpoints, so merge here and re-sort the
      // combined set the same way each individual list is already sorted.
      const [lost, found] = await Promise.all([browseLostReports(params), browseFoundReports(params)])
      const merged = [...lost.data.reports, ...found.data.reports]
      merged.sort((a, b) => {
        const delta = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        return sort === 'oldest' ? delta : -delta
      })
      return merged
    }

    fetchReports()
      .then((result) => {
        if (!cancelled) {
          setReports(result)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [activeView, debouncedSearch, category, sort])

  const hasActiveFilters = Boolean(debouncedSearch || category)

  const isCurrentSearchSaved = savedSearches.some(
    (search) => search.term === debouncedSearch && search.category === (category || undefined),
  )

  const handleSaveSearch = () => {
    if (!debouncedSearch) return
    saveSearch(debouncedSearch, category || undefined)
  }

  const handleApplySavedSearch = (term: string, savedCategory?: Category) => {
    setSearchInput(term)
    setCategory(savedCategory ?? '')
  }

  const handleClearFilters = () => {
    setSearchInput('')
    setCategory('')
  }

  // Left/Right cycle through all four tabs (wrapping), Home/End jump to
  // the first/last — immediate ("automatic") activation per the ARIA
  // APG tabs pattern, with focus following the newly active tab.
  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number

    if (event.key === 'ArrowRight') nextIndex = (index + 1) % TABS.length
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + TABS.length) % TABS.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = TABS.length - 1
    else return

    event.preventDefault()
    setActiveView(TABS[nextIndex].view)
    tabRefs.current[nextIndex]?.focus()
  }

  return (
    <section className="browse-section section">
      <div className="container">
        <div className="reports-header">
          <div>
            <h1>Browse Items</h1>
            <p>Search everything the community has reported lost or found.</p>
          </div>
        </div>

        <div className="browse-tabs" role="tablist" aria-label="Report view">
          {TABS.map((tab, index) => {
            const isActive = activeView === tab.view
            return (
              <button
                key={tab.view}
                type="button"
                role="tab"
                id={`browse-tab-${tab.view}`}
                aria-selected={isActive}
                aria-controls="browse-tabpanel"
                tabIndex={isActive ? 0 : -1}
                className={`browse-tab${isActive ? ' is-active' : ''}`}
                onClick={() => setActiveView(tab.view)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                ref={(node) => {
                  tabRefs.current[index] = node
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="browse-filters">
          <div className="form-field browse-filter-search">
            <label htmlFor="browse-search">Search</label>
            <div className="browse-search-input">
              <SearchIcon />
              <input
                id="browse-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by title or description…"
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="browse-category">Category</label>
            <select
              id="browse-category"
              value={category}
              onChange={(event) => setCategory(event.target.value as Category | '')}
            >
              <option value="">All categories</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {CATEGORY_LABELS[option]}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="browse-sort">Sort</label>
            <select
              id="browse-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as BrowseSort)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          <div className="form-field browse-filter-save">
            <span className="form-field-spacer" aria-hidden="true" />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSaveSearch}
              disabled={!debouncedSearch || isCurrentSearchSaved}
            >
              <BookmarkIcon /> {isCurrentSearchSaved ? 'Saved' : 'Save Search'}
            </button>
          </div>
        </div>

        {savedSearches.length > 0 && (
          <div className="saved-searches">
            <span className="saved-searches-label">My Searches</span>
            <div className="saved-searches-list">
              {savedSearches.map((search) => (
                <span key={search.id} className="saved-search-chip">
                  <button
                    type="button"
                    className="saved-search-chip-apply"
                    onClick={() => handleApplySavedSearch(search.term, search.category)}
                  >
                    {search.term}
                    {search.category ? ` · ${CATEGORY_LABELS[search.category]}` : ''}
                  </button>
                  <button
                    type="button"
                    className="saved-search-chip-remove"
                    onClick={() => removeSearch(search.id)}
                    aria-label={`Remove saved search "${search.term}"`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div id="browse-tabpanel" role="tabpanel" aria-labelledby={`browse-tab-${activeView}`}>
          {isLoading && (
            <>
              <div className="reports-grid" aria-hidden="true">
                <ReportCardSkeleton />
                <ReportCardSkeleton />
                <ReportCardSkeleton />
              </div>
              <p className="visually-hidden" role="status" aria-live="polite">
                Loading reports…
              </p>
            </>
          )}

          {!isLoading && error && (
            <StateMessage
              icon={<AlertIcon />}
              tone="error"
              heading="Couldn't load reports"
              description={error}
              headingLevel="h2"
            />
          )}

          {!isLoading && !error && reports && reports.length === 0 && (
            <StateMessage
              icon={hasActiveFilters ? <SearchIcon /> : <EmptyBoxIcon />}
              heading={hasActiveFilters ? 'No matching reports yet.' : EMPTY_HEADING[activeView]}
              description={
                hasActiveFilters
                  ? 'Try changing your filters or create a new report.'
                  : EMPTY_DESCRIPTION[activeView]
              }
              action={
                hasActiveFilters ? (
                  <button type="button" className="btn btn-secondary" onClick={handleClearFilters}>
                    Clear filters
                  </button>
                ) : (
                  EMPTY_ACTION[activeView]
                )
              }
              headingLevel="h2"
            />
          )}

          {!isLoading && !error && reports && reports.length > 0 && (
            <div className="reports-grid">
              {reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  to={report.reportType === 'LOST' ? `/items/${report.id}` : `/found/${report.id}`}
                  dateLabel={report.reportType === 'LOST' ? 'Lost' : 'Found'}
                  topMatchScore={topMatchScores[report.id]}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default Browse
