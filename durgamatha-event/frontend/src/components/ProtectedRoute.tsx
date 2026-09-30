import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import type { Role } from '../types/auth'
import { hasRole } from '../utils/roles'

interface ProtectedRouteProps {
  // If given, the user's role must be one of these. If not given, any logged-in user is allowed.
  allowedRoles?: Role[]
}

// Wrap routes with this to allow only logged-in users (and optionally only some roles).
// Used in AppRoutes as a "layout route": <Route element={<ProtectedRoute />}> ...pages... </Route>
// NOTE: this only improves the user experience. The real security check is on the backend.
function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, profile, profileError, loading } = useAuth()

  // Still checking the saved session: don't redirect yet, or a refresh would kick the user out
  if (loading) {
    return <p className="py-12 text-center text-gray-500">Loading...</p>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // The role could not be checked because the server could not be reached:
  // say so, instead of wrongly showing "Access denied"
  if (allowedRoles && !profile && profileError) {
    return (
      <div className="py-12 text-center">
        <p className="mx-auto max-w-md rounded bg-red-50 px-3 py-2 text-red-700">{profileError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
        >
          Try again
        </button>
      </div>
    )
  }

  // Logged in, but the role is not allowed here (or the user has no profile)
  if (allowedRoles && !hasRole(profile?.role, allowedRoles)) {
    return <Navigate to="/unauthorized" replace />
  }

  // Allowed: show the requested page
  return <Outlet />
}

export default ProtectedRoute
