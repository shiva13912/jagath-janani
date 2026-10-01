import { ButtonLink } from '../components/ui/Button'
import { usePageTitle } from '../hooks/usePageTitle'

// Shown for any URL that does not exist
function NotFoundPage() {
  usePageTitle('Page not found')
  return (
    <section className="py-16 text-center">
      <p className="text-5xl font-bold text-primary" aria-hidden="true">
        404
      </p>
      <h1 className="mt-4 text-2xl font-bold text-ink">Page not found.</h1>
      <p className="mt-2 text-muted">The page you are looking for does not exist or has been moved.</p>
      <ButtonLink to="/" className="mt-6">
        Go Home
      </ButtonLink>
    </section>
  )
}

export default NotFoundPage
