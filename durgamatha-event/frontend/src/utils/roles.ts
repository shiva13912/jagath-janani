import type { Role } from '../types/auth'

// Who may open which area. Used by the routes AND the navbar, so they always agree.
export const TEAM_ROLES: Role[] = ['ADMIN', 'TEAM_MEMBER']
export const ADMIN_ROLES: Role[] = ['ADMIN']

// true if the user's role is one of the allowed roles
export function hasRole(role: Role | undefined, allowedRoles: Role[]): boolean {
  return role !== undefined && allowedRoles.includes(role)
}
