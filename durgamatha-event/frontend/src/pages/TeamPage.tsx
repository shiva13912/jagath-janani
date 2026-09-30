import { Link } from 'react-router'

// TEAM_MEMBER and ADMIN: starting point for team tools
function TeamPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Team Area</h1>
      <p className="mt-2 text-gray-600">Only team members and admins can see this page.</p>
      <Link
        to="/team/albums"
        className="mt-6 inline-block rounded bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
      >
        Manage albums
      </Link>
    </section>
  )
}

export default TeamPage
