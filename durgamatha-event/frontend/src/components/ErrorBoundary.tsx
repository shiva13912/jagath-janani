import { Component, type ErrorInfo, type ReactNode } from 'react'
import Button from './ui/Button'
import { buttonClass } from './ui/buttonStyles'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

// Catches unexpected errors while showing a page, so the visitor sees a friendly message
// instead of a blank screen. The technical details go only to the browser console
// (for developers), never onto the page.
// (Error boundaries must be class components; React has no hook for this.)
class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unexpected error:', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <section role="alert" className="mx-auto max-w-lg py-16 text-center">
        <h1 className="text-2xl font-bold text-ink">Something went wrong.</h1>
        <p className="mt-2 text-muted">This page could not be shown. Please try again.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={() => window.location.reload()}>Reload page</Button>
          {/* A plain link (not React Router), so the app starts fresh */}
          <a href="/" className={buttonClass('secondary')}>
            Go Home
          </a>
        </div>
      </section>
    )
  }
}

export default ErrorBoundary
