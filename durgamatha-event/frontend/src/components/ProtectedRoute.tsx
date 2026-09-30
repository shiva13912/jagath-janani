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
  const { isAuthenticated, profile, loading } = useAuth()

  // Still checking the saved session: don't redirect yet, or a refresh would kick the user out
  if (loading) {
    return <p className="py-12 text-center text-gray-500">Loading...</p>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Logged in, but the role is not allowed here (or the profile could not be loaded)
  if (allowedRoles && !hasRole(profile?.role, allowedRoles)) {
    return <Navigate to="/unauthorized" replace />
  }

  // Allowed: show the requested page
  return <Outlet />
}

export default ProtectedRoute
