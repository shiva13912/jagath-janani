import { createClient } from '@supabase/supabase-js'
import { env } from './env'

// Server-side Supabase client using the SECRET service-role key.
// It bypasses Row Level Security, so it must only ever be used here on the backend.
export const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: {
    // The server doesn't keep a logged-in session of its own;
    // it only checks the tokens that users send with each request.
    persistSession: false,
    autoRefreshToken: false,
  },
})
