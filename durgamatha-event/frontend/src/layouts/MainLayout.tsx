import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router'
import ErrorBoundary from '../components/ErrorBoundary'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { LoadingState } from '../components/ui/Spinner'

function MainLayout() {
  const location = useLocation()

  return (
    <div className="flex min-h-screen flex-col bg-page text-ink">
      {/* Lets keyboard users jump past the menu straight to the page */}
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-primary px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to main content
      </a>
      <Navbar />

      {/* <Outlet /> is where the current page is shown.
          key: a new page starts with a fresh error boundary, so one broken page doesn't stick. */}
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 focus:outline-none sm:px-6">
        <ErrorBoundary key={location.pathname}>
          {/* Shown while a page that is loaded on demand (admin/team pages) downloads */}
          <Suspense fallback={<LoadingState />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>

      <Footer />
    </div>
  )
}

export default MainLayout
