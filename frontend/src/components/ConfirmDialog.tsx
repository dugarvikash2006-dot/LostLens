import { useEffect, useRef } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import './ConfirmDialog.css'

interface ConfirmDialogProps {
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  /** True while the confirmed action is in flight — disables both buttons. */
  isConfirming?: boolean
  tone?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

/**
 * A small, focused confirmation modal for actions that need an
 * "are you sure" step (currently: deleting a report). Not a general
 * modal system — just enough accessibility to do this one job well:
 * focus moves to Cancel (the safe default for a destructive action) on
 * open, Tab/Shift+Tab cycle between the two buttons only, and Escape
 * cancels.
 */
function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  isConfirming = false,
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelButtonRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isConfirming) {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel, isConfirming])

  // Only two focusable elements ever exist in this dialog — with
  // exactly two, Tab and Shift+Tab both just move to "the other one",
  // so there's no need to branch on shiftKey separately.
  const handleTrapKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return

    event.preventDefault()
    const isCancelFocused = document.activeElement === cancelButtonRef.current
    const next = isCancelFocused ? confirmButtonRef.current : cancelButtonRef.current
    next?.focus()
  }

  return (
    <div
      className="confirm-dialog-backdrop"
      onMouseDown={() => {
        if (!isConfirming) onCancel()
      }}
    >
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={handleTrapKeyDown}
      >
        <h2 id="confirm-dialog-title">{title}</h2>
        <p id="confirm-dialog-description">{description}</p>

        <div className="confirm-dialog-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isConfirming}
            ref={cancelButtonRef}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={isConfirming}
            ref={confirmButtonRef}
          >
            {isConfirming ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
