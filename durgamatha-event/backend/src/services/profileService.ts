import { supabaseAdmin } from '../config/supabase'
import type { AuthUser, Role } from '../types/auth'

// Shape of a row in the profiles table (database column names)
interface ProfileRow {
  id: string
  full_name: string
  email: string
  role: Role
  avatar_url: string | null
}

// Reads one profile by user id. Returns null if there is no profile.
export async function getProfileById(userId: string): Promise<AuthUser | null> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, role, avatar_url')
    .eq('id', userId)
    .maybeSingle<ProfileRow>()

  if (error) throw new Error(`Could not load profile: ${error.message}`)
  if (!data) return null

  // Convert database names (snake_case) to the names we use in code (camelCase)
  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    role: data.role,
    avatarUrl: data.avatar_url,
  }
}
