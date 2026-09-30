import { Link } from 'react-router'

// Shown when a logged-in user opens a page their role does not allow
function UnauthorizedPage() {
  return (
    <section className="py-12 text-center">
      <h1 className="text-2xl font-bold">Access denied</h1>
      <p className="mt-2 text-gray-600">You don't have permission to view this page.</p>
      <Link to="/profile" className="mt-4 inline-block text-orange-600 hover:underline">
        Go to my profile
      </Link>
    </section>
  )
}

export default UnauthorizedPage
