import { useEffect, useState } from 'react'

// LostLens signature visual: a circular indicator for a Lens Match
// confidence score. Built once here so every place a match score
// appears (Dashboard, listings, Report Details, the Lens Match
// experience) renders identically — no duplicated ring markup/CSS.
//
// The ring fills in on mount rather than appearing already-full: it
// renders at 0% for one frame, then transitions to the real score via
// the existing `.ring-fill` CSS transition (index.css). The percentage
// number itself never animates — it shows the final value immediately,
// so a screen reader (and a sighted user glancing quickly) never sees
// a transiently wrong number, only the ring's fill is decorative
// motion. `prefers-reduced-motion` is already handled globally (the
// transition duration collapses to ~0), so no extra branching is
// needed here for that.

const CIRCUMFERENCE = 2 * Math.PI * 28

export interface ConfidenceRingProps {
  /** 0-100. Values outside this range are clamped. */
  score: number
  size?: 'sm' | 'md' | 'lg'
  /** Overrides the default "N% match confidence" accessible label. */
  label?: string
  /**
   * Gates when the fill begins. Defaults to true (fill on mount, the
   * original behavior every existing usage relies on). Pass false to
   * hold the ring at 0% until a caller-controlled moment — e.g. a step
   * in an animated sequence — flips it to true.
   */
  startFill?: boolean
}

function ConfidenceRing({ score, size = 'md', label, startFill = true }: ConfidenceRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (!startFill) return

    // Mount at 0%, then flip on the next frame so the browser paints
    // the empty ring first and the fill transition actually plays,
    // rather than mounting already at its final value.
    const frame = requestAnimationFrame(() => setRevealed(true))
    return () => cancelAnimationFrame(frame)
  }, [startFill])

  const displayPct = revealed ? clamped : 0
  const offset = CIRCUMFERENCE * (1 - displayPct / 100)

  return (
    <div
      className={`ring ring--${size}`}
      role="img"
      aria-label={label ?? `${clamped}% match confidence`}
    >
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle className="ring-track" cx="32" cy="32" r="28" />
        <circle
          className="ring-fill"
          cx="32"
          cy="32"
          r="28"
          style={{ strokeDasharray: CIRCUMFERENCE, strokeDashoffset: offset }}
        />
      </svg>
      <span className="ring-value" aria-hidden="true">
        {clamped}%
      </span>
    </div>
  )
}

export default ConfidenceRing
