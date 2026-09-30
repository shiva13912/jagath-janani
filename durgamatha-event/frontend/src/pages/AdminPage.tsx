import { Link } from 'react-router'

// ADMIN only: starting point for admin tools
function AdminPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Admin Area</h1>
      <p className="mt-2 text-gray-600">Only admins can see this page.</p>
      <Link
        to="/admin/events"
        className="mt-6 inline-block rounded bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
      >
        Manage events
      </Link>
    </section>
  )
}

export default AdminPage
