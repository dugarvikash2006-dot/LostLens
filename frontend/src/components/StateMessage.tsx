import type { ReactNode } from 'react'
import './StateMessage.css'

interface StateMessageProps {
  icon: ReactNode
  heading: string
  description?: string
  tone?: 'neutral' | 'error'
  action?: ReactNode
  /** Match the correct heading level for wherever this renders — h2
   *  when it's the first heading on the page/section, h3 when it's
   *  nested under an existing h2. Defaults to h3, the more common case
   *  (most usages sit inside an already-headed section). */
  headingLevel?: 'h2' | 'h3'
}

/**
 * The one inline "nothing to show, here's why" pattern used everywhere
 * in the app — empty lists, failed fetches, unavailable sections.
 * Previously each page had its own plain-text version of this; a
 * single shared component means fixing or restyling this concept only
 * ever happens in one place.
 */
function StateMessage({ icon, heading, description, tone = 'neutral', action, headingLevel = 'h3' }: StateMessageProps) {
  const Heading = headingLevel

  return (
    <div
      className={`state-message ${tone === 'error' ? 'state-message-error' : ''}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <span className="state-message-icon">{icon}</span>
      <div>
        <Heading>{heading}</Heading>
        {description && <p>{description}</p>}
        {action && <div className="state-message-action">{action}</div>}
      </div>
    </div>
  )
}

export default StateMessage
