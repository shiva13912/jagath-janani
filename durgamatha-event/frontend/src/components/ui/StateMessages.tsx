import type { ReactNode } from 'react'
import Button from './Button'

// "No events yet." in a dashed box, with an optional action (e.g. a "Create Event" button)
export function EmptyState({ message, children, className = '' }: { message: string; children?: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border-2 border-dashed border-line bg-surface/60 px-6 py-10 text-center ${className}`}>
      <p className="text-muted">{message}</p>
      {children && <div className="mt-4 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  )
}

// A page or section that could not be loaded: a friendly message and a "Try again" button.
// The message comes from getErrorMessage, so raw server errors are never shown.
export function ErrorState({ message = 'Something went wrong.', onRetry, className = '' }: { message?: string; onRetry?: () => void; className?: string }) {
  return (
    <div role="alert" className={`rounded-xl border border-red-200 bg-danger-soft px-6 py-8 text-center ${className}`}>
      <p className="font-semibold text-danger">Something went wrong.</p>
      {message !== 'Something went wrong.' && <p className="mt-1 text-danger">{message}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
