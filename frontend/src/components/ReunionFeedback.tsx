import { REUNION_METHOD_OPTIONS, REUNION_METHOD_LABELS } from '../types/item'
import type { ReunionMethod } from '../types/item'

interface ReunionFeedbackProps {
  onSelect: (method: ReunionMethod) => void
  onSkip: () => void
}

/**
 * The optional, non-blocking follow-up shown right after a report is
 * marked reunited. Deliberately not a dialog — answering (or skipping)
 * this must never gate or delay the reunion itself, which has already
 * happened by the time this renders.
 */
function ReunionFeedback({ onSelect, onSkip }: ReunionFeedbackProps) {
  return (
    <div className="reunion-feedback" role="group" aria-labelledby="reunion-feedback-heading">
      <p id="reunion-feedback-heading">How did the reunion happen?</p>
      <div className="reunion-feedback-options">
        {REUNION_METHOD_OPTIONS.map((method) => (
          <button
            key={method}
            type="button"
            className="reunion-feedback-option"
            onClick={() => onSelect(method)}
          >
            {REUNION_METHOD_LABELS[method]}
          </button>
        ))}
        <button type="button" className="reunion-feedback-option reunion-feedback-skip" onClick={onSkip}>
          Skip
        </button>
      </div>
    </div>
  )
}

export default ReunionFeedback
