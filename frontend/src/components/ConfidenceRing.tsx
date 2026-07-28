// LostLens signature visual: a circular indicator for a Lens Match
// confidence score. Built once here so every place a match score
// appears (Dashboard, listings, Report Details, the Lens Match
// experience) renders identically — no duplicated ring markup/CSS.
//
// The stroke-dashoffset transition is already wired up in index.css
// (`.ring-fill`), so this component is ready for the Phase 5 "animate
// on appearance" treatment without any structural change: mounting it
// with an initial 0% and updating to the real score on the next tick
// (or via a CSS animation keyed on mount) will animate for free.

const CIRCUMFERENCE = 2 * Math.PI * 28

export interface ConfidenceRingProps {
  /** 0-100. Values outside this range are clamped. */
  score: number
  size?: 'sm' | 'md' | 'lg'
  /** Overrides the default "N% match confidence" accessible label. */
  label?: string
}

function ConfidenceRing({ score, size = 'md', label }: ConfidenceRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  const offset = CIRCUMFERENCE * (1 - clamped / 100)

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
