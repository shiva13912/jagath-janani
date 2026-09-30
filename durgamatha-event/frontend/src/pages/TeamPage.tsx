import { Link } from 'react-router'

// TEAM_MEMBER and ADMIN: starting point for team tools
function TeamPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Team Area</h1>
      <p className="mt-2 text-gray-600">Only team members and admins can see this page.</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {[
          { to: '/team/dashboard', label: 'Dashboard' },
          { to: '/team/finance', label: 'Finance (view only)' },
          { to: '/team/albums', label: 'Manage albums' },
        ].map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="rounded bg-orange-600 px-4 py-2 text-center font-semibold text-white hover:bg-orange-700"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  )
}

export default TeamPage
