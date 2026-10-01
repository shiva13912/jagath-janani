import type { ReactNode } from 'react'

export type AlertTone = 'success' | 'error' | 'warning' | 'info'

const toneClass: Record<AlertTone, string> = {
  success: 'border-green-200 bg-success-soft text-success',
  error: 'border-red-200 bg-danger-soft text-danger',
  warning: 'border-amber-200 bg-warning-soft text-warning',
  info: 'border-orange-200 bg-primary-soft text-primary-hover',
}

// A symbol AND a hidden word, so the meaning never depends on colour alone
const toneIcon: Record<AlertTone, { symbol: string; word: string }> = {
  success: { symbol: '✓', word: 'Success:' },
  error: { symbol: '!', word: 'Error:' },
  warning: { symbol: '!', word: 'Warning:' },
  info: { symbol: 'i', word: 'Note:' },
}

interface AlertProps {
  tone: AlertTone
  children: ReactNode
  onRetry?: () => void // shows a "Try again" button
  className?: string
}

// The message box used everywhere: success after saving, errors, warnings and notes.
// Errors use role="alert" (read out immediately); the others use role="status".
function Alert({ tone, children, onRetry, className = '' }: AlertProps) {
  const icon = toneIcon[tone]
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${toneClass[tone]} ${className}`}>
      <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">
        {icon.symbol}
      </span>
      <div className="min-w-0 flex-1">
        <span className="sr-only">{icon.word} </span>
        {children}
        {onRetry && (
          <>
            {' '}
            <button type="button" onClick={onRetry} className="font-semibold underline underline-offset-2">
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default Alert
