import { isAuthRetryableFetchError } from '@supabase/supabase-js'
import type { NextFunction, Request, Response } from 'express'
import { supabaseAdmin } from '../config/supabase'
import { getProfileById } from '../services/profileService'

// Protects a route: only requests with a valid Supabase access token get through.
// On success, req.user holds the verified user (id, email, name, role).
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  // 1. Read the header. Expected format: "Authorization: Bearer <token>"
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : ''

  if (!token) {
    res.status(401).json({ success: false, message: 'Not logged in: missing access token' })
    return
  }

  try {
    // 2. Ask Supabase Auth whether this token is genuine and not expired.
    //    We never trust a user id sent in the body or URL; the id comes from the verified token.
    const { data, error } = await supabaseAdmin.auth.getUser(token)
    if (error && isAuthRetryableFetchError(error)) {
      // Supabase could not be reached: that's a server problem, not a bad token
      throw error
    }
    if (error || !data.user) {
      res.status(401).json({ success: false, message: 'Invalid or expired access token' })
      return
    }

    // 3. Load the user's profile, which holds their role
    const profile = await getProfileById(data.user.id)
    if (!profile) {
      res.status(403).json({ success: false, message: 'No profile found for this user' })
      return
    }

    // 4. Attach the verified user to the request for the next middleware/controller
    req.user = profile
    next()
  } catch (err) {
    // Unexpected problem (e.g. database unreachable): let the error handler return a 500
    next(err)
  }
}
