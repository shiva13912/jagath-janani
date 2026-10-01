// The three roles, matching the user_role enum in supabase/schema.sql
export type Role = 'ADMIN' | 'TEAM_MEMBER' | 'PUBLIC'

// A row from the profiles table, as returned by GET /api/auth/me
export interface Profile {
  id: string
  fullName: string
  email: string
  role: Role
  avatarUrl: string | null
}

export interface RegisterData {
  fullName: string
  email: string
  password: string
}

export interface LoginData {
  email: string
  password: string
}
