import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ObjectPortrait from '../components/ObjectPortrait'
import ConfidenceRing from '../components/ConfidenceRing'
import LensMatchMark from '../components/LensMatchMark'
import HeroStory from '../components/HeroStory'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { getItemStats } from '../api/item.api'
import type { ItemStats } from '../types/item'
import './Home.css'

// Landing page (Phase 5 redesign). Marketing content only — no
// authenticated data. The Dashboard page is where a logged-in user's
// real reports and Lens Match results live.

// Phase 6.1: word-level stagger for the hero heading. Split at the
// word level (not per-character) so each span is a real word for
// screen readers and text selection; "Lens" keeps the existing accent
// styling.
const heroWords = [
  { text: 'Lost', accent: false },
  { text: 'something?', accent: false },
  { text: 'Lens', accent: true },
  { text: 'finds', accent: false },
  { text: 'it.', accent: false },
]

const steps = [
  {
    title: 'Report',
    description: 'Add a photo and a few details — lost or found.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 16V4m0 0-4 4m4-4 4 4M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'Lens Match compares',
    description: 'Every photo is checked against opposite reports automatically.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    title: 'Reunite',
    description: 'Review your matches and arrange the handoff.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 20s-6.5-4.1-9-8.2C1.2 8.6 2.5 5 6 5c2 0 3.3 1 4 2 0-1 2-2 4-2 3.5 0 4.8 3.6 3 6.8C18.5 15.9 12 20 12 20Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
]

const reunions = [
  { item: 'water-bottle' as const, name: 'Blue Water Bottle', place: 'Sports Complex', days: 2 },
  { item: 'headphones' as const, name: 'Black Wireless Headphones', place: 'Library', days: 1 },
  { item: 'keys' as const, name: 'Silver Keychain', place: 'Parking Lot', days: 3 },
]

function Home() {
  const { ref: statsRef, isVisible: statsVisible } = useScrollReveal<HTMLElement>()
  const { ref: howItWorksRef, isVisible: howItWorksVisible } = useScrollReveal<HTMLElement>()
  const { ref: lensMatchRef, isVisible: lensMatchVisible } = useScrollReveal<HTMLElement>()
  const { ref: recentItemsRef, isVisible: recentItemsVisible } = useScrollReveal<HTMLElement>()
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollReveal<HTMLElement>()

  const [stats, setStats] = useState<ItemStats | null>(null)

  useEffect(() => {
    let cancelled = false

    getItemStats()
      .then((response) => {
        if (!cancelled) {
          setStats(response.data.stats)
        }
      })
      .catch(() => {
        // Non-critical — the rest of the landing page works fine
        // without these; just skip rendering the section.
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      {/* ---------------- HERO ---------------- */}
      <section className="hero section">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">Powered by Lens Match</span>
            <h1>
              {heroWords.map((word, index) => (
                <span
                  className={`hero-word${word.accent ? ' hero-accent' : ''}`}
                  style={{ animationDelay: `${index * 0.08}s` }}
                  key={word.text}
                >
                  {word.text}
                </span>
              ))}
            </h1>
            <p className="hero-subtext hero-enter" style={{ animationDelay: '0.4s' }}>
              LostLens compares photos of lost and found items automatically, so the
              right match finds you — often before you&apos;ve finished searching.
            </p>
            <div className="hero-actions hero-enter" style={{ animationDelay: '0.55s' }}>
              <Link to="/create-lost" className="btn btn-primary btn-lg">
                Report a lost item
              </Link>
              <Link to="/create-found" className="btn btn-secondary btn-lg">
                Report a found item
              </Link>
            </div>
          </div>

          <div className="hero-visual hero-enter" style={{ animationDelay: '0.5s' }}>
            <HeroStory />
          </div>
        </div>
      </section>

      {/* ---------------- STATS ---------------- */}
      {stats && (
        <section
          className={`section stats-section scroll-reveal${statsVisible ? ' is-visible' : ''}`}
          ref={statsRef}
          aria-label="LostLens statistics"
        >
          <div className="container">
            <div className="stats-grid">
              <div className="stat-tile card">
                <p className="stat-value mono">{stats.itemsReunited}</p>
                <p className="stat-label">Items Reunited</p>
              </div>
              <div className="stat-tile card">
                <p className="stat-value mono">{stats.successRate}%</p>
                <p className="stat-label">Success Rate</p>
              </div>
              <div className="stat-tile card">
                <p className="stat-value mono">{stats.todaysReports}</p>
                <p className="stat-label">Today&apos;s Reports</p>
              </div>
              <div className="stat-tile card">
                <p className="stat-value mono">{stats.potentialMatches}</p>
                <p className="stat-label">Potential Matches</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section
        id="how-it-works"
        className={`section how-it-works scroll-reveal${howItWorksVisible ? ' is-visible' : ''}`}
        ref={howItWorksRef}
      >
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">Process</span>
            <h2>Three steps to reunited</h2>
          </div>

          <ol className="steps-grid">
            {steps.map((step, index) => (
              <li className="step-card" key={step.title}>
                <span className="step-number mono">{String(index + 1).padStart(2, '0')}</span>
                <span className="step-icon">{step.icon}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------- LENS MATCH TEASER ---------------- */}
      <section
        className={`section lens-match-section scroll-reveal${lensMatchVisible ? ' is-visible' : ''}`}
        ref={lensMatchRef}
      >
        <div className="container">
          <div className="lens-match-teaser card">
            <div className="lens-match-teaser-head">
              <h2>
                <LensMatchMark />
              </h2>
              <span className="badge badge-found">91% match</span>
            </div>
            <div className="lens-match-teaser-body">
              <ObjectPortrait item="headphones" className="lens-match-teaser-thumb" />
              <div>
                <h3>Black Wireless Headphones</h3>
                <p className="lens-match-teaser-meta">Found near Library, 2nd Floor</p>
                <p className="lens-match-teaser-copy">
                  The moment a found report is added, Lens Match checks it against every
                  open lost report automatically — no searching required.
                </p>
              </div>
              <ConfidenceRing score={91} />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- RECENTLY REUNITED ---------------- */}
      <section
        className={`section recent-items scroll-reveal${recentItemsVisible ? ' is-visible' : ''}`}
        ref={recentItemsRef}
      >
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">Community</span>
            <h2>Recently reunited</h2>
            <p>A few of the items Lens Match has helped bring home.</p>
          </div>

          <div className="items-grid">
            {reunions.map((r) => (
              <div className="item-card card" key={r.name}>
                <ObjectPortrait item={r.item} className="item-card-thumb" />
                <div className="item-card-body">
                  <h3 className="item-card-title">{r.name}</h3>
                  <p className="item-card-meta">
                    Reunited in {r.days} {r.days === 1 ? 'day' : 'days'} · {r.place}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section
        className={`section cta-section scroll-reveal${ctaVisible ? ' is-visible' : ''}`}
        ref={ctaRef}
      >
        <div className="container cta-inner">
          <h2>Lost something or found something?</h2>
          <p>
            Create a report and let Lens Match help connect the right item with the
            right person.
          </p>
          <div className="cta-actions">
            <Link to="/create-lost" className="btn btn-primary">
              Report Lost Item
            </Link>
            <Link to="/create-found" className="btn btn-secondary btn-on-dark">
              Report Found Item
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

export default Home
