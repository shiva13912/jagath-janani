import { useAuth } from '../hooks/useAuth'

// Placeholder page for testing login. Any logged-in user can open it.
function ProfilePage() {
  const { user, profile } = useAuth()

  return (
    <section className="mx-auto max-w-md rounded-lg bg-white p-6 shadow">
      <h1 className="text-2xl font-bold">My Profile</h1>
      <dl className="mt-4 space-y-2 text-gray-700">
        <div>
          <dt className="text-sm text-gray-500">Full name</dt>
          <dd>{profile?.fullName || '-'}</dd>
        </div>
        <div>
          <dt className="text-sm text-gray-500">Email</dt>
          <dd>{profile?.email ?? user?.email}</dd>
        </div>
        <div>
          <dt className="text-sm text-gray-500">Role</dt>
          <dd className="font-semibold">{profile?.role ?? 'Unknown (profile not loaded)'}</dd>
        </div>
      </dl>
    </section>
  )
}

export default ProfilePage
