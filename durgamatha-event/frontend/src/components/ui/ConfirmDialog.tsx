import { useEffect, useRef, type ReactNode } from 'react'
import Button from './Button'

interface ConfirmDialogProps {
  title: string // "Delete event?"
  children: ReactNode // what will happen
  confirmLabel: string // "Delete"
  busyLabel?: string // "Deleting..."
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

// The confirmation box for destructive actions (delete event, album, income, expense).
// - Esc or Cancel closes it; Cancel has focus first, so pressing Enter by accident deletes nothing.
// - Tab stays inside the box, and focus goes back to the button that opened it.
function ConfirmDialog({ title, children, confirmLabel, busyLabel, busy = false, onConfirm, onCancel }: ConfirmDialogProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const latest = useRef({ onCancel, busy })
  useEffect(() => {
    latest.current = { onCancel, busy }
  })

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    cancelRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !latest.current.busy) latest.current.onCancel()
      if (event.key === 'Tab' && boxRef.current) {
        const buttons = boxRef.current.querySelectorAll<HTMLElement>('button:not([disabled])')
        if (buttons.length === 0) return
        const first = buttons[0]
        const last = buttons[buttons.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (previouslyFocused?.isConnected) previouslyFocused.focus()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div ref={boxRef} role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-body" className="w-full max-w-md rounded-xl bg-surface p-6 shadow-xl">
        <h2 id="confirm-title" className="text-lg font-semibold text-ink">
          {title}
        </h2>
        <div id="confirm-body" className="mt-2 space-y-2 text-muted">
          {children}
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button ref={cancelRef} variant="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={busy} loadingText={busyLabel}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
