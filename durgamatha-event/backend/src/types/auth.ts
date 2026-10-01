// The three roles, matching the user_role enum in supabase/schema.sql
export type Role = 'ADMIN' | 'TEAM_MEMBER' | 'PUBLIC'

// The logged-in user, as attached to req.user by requireAuth.
// Everything here comes from the VERIFIED token and our database, never from the request body.
export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: Role
  avatarUrl: string | null
}
