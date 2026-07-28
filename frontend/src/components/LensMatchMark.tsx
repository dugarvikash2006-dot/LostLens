// The consistent small brand mark for the Lens Match feature — a simple
// custom aperture/lens icon paired with the feature name, set in the
// same typographic treatment everywhere it appears. Kept deliberately
// restrained (no gradient, no flashy motion) per the brief: a premium
// feature identity, not a gimmick.

interface LensMatchMarkProps {
  label?: string
}

function LensMatchMark({ label = 'Lens Match' }: LensMatchMarkProps) {
  return (
    <span className="lens-match-mark">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M12 2v3M12 19v3M2 12h3M19 12h3"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      {label}
    </span>
  )
}

export default LensMatchMark
