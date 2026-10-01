import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Add them to frontend/.env (see .env.example).')
}

// Browser-side Supabase client using the PUBLIC anon/publishable key.
// It handles sign up, login and logout, and keeps the session in localStorage
// so the user stays logged in after a page refresh.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
