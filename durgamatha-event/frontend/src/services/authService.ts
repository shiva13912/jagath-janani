import type { Session } from '@supabase/supabase-js'
import { supabase } from '../config/supabase'
import type { LoginData, Profile, RegisterData } from '../types/auth'
import api from './api'

// All login-related calls live here, so pages and components never talk to Supabase directly.

// Creates a new account. Supabase Auth stores the password (hashed), and our
// database trigger creates the profile with role PUBLIC.
// Returns true if the user is logged in right away (when "Confirm email" is off).
export async function register({ fullName, email, password }: RegisterData): Promise<boolean> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Saved as user metadata; the trigger copies it into profiles.full_name
      data: { full_name: fullName },
      // If "Confirm email" is on, the link in the email brings the user back to THIS website
      // (localhost while developing, the Vercel address in production). The address must also be
      // listed under Supabase -> Authentication -> URL Configuration -> Redirect URLs.
      emailRedirectTo: `${window.location.origin}/login`,
    },
  })
  if (error) throw new Error(error.message)
  return data.session !== null
}

export async function login({ email, password }: LoginData): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
}

export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

// Returns the saved session (from localStorage) or null if nobody is logged in
export async function getCurrentSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return data.session
}

// Asks OUR backend for the logged-in user's profile (including their role).
// The access token is added automatically by the interceptor in api.ts.
export async function getMyProfile(): Promise<Profile> {
  const response = await api.get<{ success: boolean; profile: Profile }>('/auth/me')
  return response.data.profile
}
