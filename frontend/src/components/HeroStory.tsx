import { useEffect, useState } from 'react'
import ConfidenceRing from './ConfidenceRing'
import LensMatchMark from './LensMatchMark'

// A short, one-time sequence (~4.5s) told entirely in the app's own UI
// vocabulary: a lost report and a found report get compared and
// matched. Each entry is "how long after mount that step starts";
// index 0 -> step 1, index 1 -> step 2, etc.
const STEP_DELAYS_MS = [150, 900, 2000, 2900, 4200]
const FINAL_STEP = STEP_DELAYS_MS.length

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Starts at the final step immediately when the user prefers reduced
// motion (checked via a lazy initializer, not an effect, since it's a
// synchronous read with nothing to subscribe to) — otherwise starts at
// 0 and steps through the sequence once via a chain of timeouts.
function useHeroStorySteps(): number {
  const [step, setStep] = useState(() => (prefersReducedMotion() ? FINAL_STEP : 0))

  useEffect(() => {
    if (prefersReducedMotion()) return

    const timers = STEP_DELAYS_MS.map((delay, index) =>
      window.setTimeout(() => setStep(index + 1), delay),
    )
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [])

  return step
}

const floaters = [
  { key: 'ai-vision', label: 'AI Vision', position: 'a' },
  { key: 'reports-today', label: '12 reports today', position: 'b' },
  { key: 'recent-match', label: 'Recent Match · 91%', position: 'c' },
  { key: 'reunited', label: '2 students reunited', position: 'd' },
]

/**
 * The landing page's signature hero moment: a lost report and a found
 * report get compared and matched, dramatizing exactly what LostLens
 * does using the app's own report cards, confidence ring, and Lens
 * Match mark — rather than a decorative illustration unrelated to the
 * product. Purely illustrative example content (not a real report), so
 * the whole scene is aria-hidden; the same idea is already stated in
 * words by the hero heading and subtext beside it.
 */
function HeroStory() {
  const step = useHeroStorySteps()

  return (
    <div className="hero-story-stage" aria-hidden="true">
      {floaters.map((floater) => (
        <span
          key={floater.key}
          className={`hero-story-floater hero-story-floater-${floater.position}${
            step >= 1 ? ' is-visible' : ''
          }`}
        >
          {floater.label}
        </span>
      ))}

      <div className="hero-story-scene">
        <div
          className={`hero-story-card hero-story-card-lost${step >= 1 ? ' is-visible' : ''}${
            step === 2 ? ' is-scanning' : ''
          }`}
        >
          <span className="badge badge-lost">Lost</span>
          <p className="hero-story-card-title">Backpack</p>
          <p className="hero-story-card-meta">Uploaded 2 hours ago · Sports Complex</p>
          <span className="hero-story-scan-line" />
        </div>

        <div
          className={`hero-story-connector${step >= 3 ? ' is-visible' : ''}${
            step >= 5 ? ' is-solid' : ''
          }`}
        >
          <svg viewBox="0 0 80 24" preserveAspectRatio="none" focusable="false">
            <line x1="2" y1="12" x2="78" y2="12" />
          </svg>
          <div className={`hero-story-ring${step >= 4 ? ' is-visible' : ''}`}>
            <ConfidenceRing score={91} size="md" startFill={step >= 4} />
          </div>
        </div>

        <div className={`hero-story-card hero-story-card-found${step >= 3 ? ' is-visible' : ''}`}>
          <span className="badge badge-found">Found</span>
          <p className="hero-story-card-title">Backpack</p>
          <p className="hero-story-card-meta">Uploaded 35 min ago · Library</p>
        </div>
      </div>

      <div className={`hero-story-badge${step >= 4 ? ' is-visible' : ''}`}>
        <LensMatchMark />
      </div>

      <p className={`hero-story-confirmation${step >= 5 ? ' is-visible' : ''}`}>
        Potential match found
      </p>
    </div>
  )
}

export default HeroStory
