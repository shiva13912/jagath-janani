import type { Role } from '../types/auth'
import { ADMIN_ROLES, hasRole, TEAM_ROLES } from './roles'

export interface NavItem {
  label: string
  path: string
  end?: boolean // true: only "active" on exactly this URL (used for Home)
}

// Everyone sees these
export const publicNav: NavItem[] = [
  { label: 'Home', path: '/', end: true },
  { label: 'Events', path: '/events' },
  { label: 'Gallery', path: '/gallery' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
]

// The "Manage" menu for team members and admins. Public users get none.
// This only hides links; the backend still checks every request.
export function workspaceNav(role: Role | undefined): NavItem[] {
  if (hasRole(role, ADMIN_ROLES)) {
    return [
      { label: 'Dashboard', path: '/admin/dashboard' },
      { label: 'Events', path: '/admin/events' },
      { label: 'Albums', path: '/admin/albums' },
      { label: 'Media', path: '/gallery' }, // photos and videos are managed inside each album
      { label: 'Income', path: '/admin/income' },
      { label: 'Expenses', path: '/admin/expenses' },
      { label: 'Profile', path: '/profile' },
    ]
  }
  if (hasRole(role, TEAM_ROLES)) {
    return [
      { label: 'Dashboard', path: '/team/dashboard' },
      { label: 'Events', path: '/events' }, // team members view events; only admins change them
      { label: 'Albums', path: '/team/albums' },
      { label: 'Media', path: '/gallery' },
      { label: 'Finance', path: '/team/finance' },
      { label: 'Profile', path: '/profile' },
    ]
  }
  return []
}

// Where the "Dashboard" of each role lives (used after login and by the old /admin and /team pages)
export function dashboardPath(role: Role | undefined): string | null {
  if (hasRole(role, ADMIN_ROLES)) return '/admin/dashboard'
  if (hasRole(role, TEAM_ROLES)) return '/team/dashboard'
  return null
}
