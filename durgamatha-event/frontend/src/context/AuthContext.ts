import type { User } from '@supabase/supabase-js'
import { createContext } from 'react'
import type { LoginData, Profile, RegisterData } from '../types/auth'

// Everything the rest of the app can know or do about the logged-in user
export interface AuthContextValue {
  user: User | null // the Supabase Auth user (id, email), or null when logged out
  profile: Profile | null // our profiles row (full name, role), or null
  loading: boolean // true while we are still finding out who is logged in
  isAuthenticated: boolean
  login: (data: LoginData) => Promise<void>
  register: (data: RegisterData) => Promise<boolean>
  logout: () => Promise<void>
}

// The "box" that holds the auth state. AuthProvider fills it, useAuth() reads it.
export const AuthContext = createContext<AuthContextValue | null>(null)
