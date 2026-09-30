import { Link } from 'react-router'

// ADMIN only: starting point for admin tools
function AdminPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Admin Area</h1>
      <p className="mt-2 text-gray-600">Only admins can see this page.</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          to="/admin/events"
          className="rounded bg-orange-600 px-4 py-2 text-center font-semibold text-white hover:bg-orange-700"
        >
          Manage events
        </Link>
        <Link
          to="/admin/albums"
          className="rounded bg-orange-600 px-4 py-2 text-center font-semibold text-white hover:bg-orange-700"
        >
          Manage albums
        </Link>
      </div>
    </section>
  )
}

export default AdminPage
