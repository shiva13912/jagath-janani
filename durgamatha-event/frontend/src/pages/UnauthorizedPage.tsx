import { ButtonLink } from '../components/ui/Button'
import { usePageTitle } from '../hooks/usePageTitle'

// Shown when a logged-in user opens a page their role does not allow
function UnauthorizedPage() {
  usePageTitle('Access denied')
  return (
    <section className="py-16 text-center">
      <h1 className="text-2xl font-bold text-ink">Access denied</h1>
      <p className="mt-2 text-muted">You don't have permission to view this page.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <ButtonLink to="/">Go Home</ButtonLink>
        <ButtonLink to="/profile" variant="secondary">
          My profile
        </ButtonLink>
      </div>
    </section>
  )
}

export default UnauthorizedPage
