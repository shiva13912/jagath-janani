import Badge from '../components/ui/Badge'
import { ButtonLink } from '../components/ui/Button'
import Card from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'
import { usePageTitle } from '../hooks/usePageTitle'
import { dashboardPath } from '../utils/navigation'

const roleLabel = { PUBLIC: 'Public', TEAM_MEMBER: 'Team member', ADMIN: 'Admin' } as const

// The logged-in user's own details. Any logged-in user can open it.
function ProfilePage() {
  usePageTitle('My Profile')
  const { user, profile } = useAuth()
  const dashboard = dashboardPath(profile?.role)

  return (
    <Card className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold text-ink">My Profile</h1>
      <dl className="mt-5 space-y-4">
        <div>
          <dt className="text-sm text-muted">Full name</dt>
          <dd className="font-medium text-ink">{profile?.fullName || '-'}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Email</dt>
          <dd className="font-medium break-words text-ink">{profile?.email ?? user?.email}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Role</dt>
          <dd className="mt-1">
            {profile ? (
              <Badge tone={profile.role === 'PUBLIC' ? 'neutral' : 'primary'}>
                {roleLabel[profile.role]} ({profile.role})
              </Badge>
            ) : (
              <span className="text-muted">Unknown (profile not loaded)</span>
            )}
          </dd>
        </div>
      </dl>
      {dashboard && (
        <ButtonLink to={dashboard} fullWidth className="mt-6">
          Go to Dashboard
        </ButtonLink>
      )}
    </Card>
  )
}

export default ProfilePage
