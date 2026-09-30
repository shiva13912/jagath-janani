import type { User } from '@supabase/supabase-js'
import { isAxiosError } from 'axios'
import { useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../config/supabase'
import * as authService from '../services/authService'
import type { Profile } from '../types/auth'
import { getErrorMessage } from '../utils/apiError'
import { AuthContext } from './AuthContext'

// Wraps the whole app (see main.tsx) so every component can use useAuth()
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [sessionChecked, setSessionChecked] = useState(false)
  // Remembers which user the loaded profile belongs to.
  // error is set when the profile could not be loaded because of a server/network problem.
  const [profileState, setProfileState] = useState<{ userId: string; profile: Profile | null; error: string } | null>(
    null,
  )

  // 1. Detect the current session and listen for login/logout/token refresh.
  //    Supabase calls this right away with the saved session (after a page refresh too).
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setSessionChecked(true)
    })
    // Stop listening when the provider is removed
    return () => data.subscription.unsubscribe()
  }, [])

  // 2. Whenever a different user logs in, load their profile (with role) from our backend
  const userId = user?.id
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    authService
      .getMyProfile()
      .then((profile) => !cancelled && setProfileState({ userId, profile, error: '' }))
      .catch((err) => {
        if (cancelled) return
        // 401/403 mean "no valid profile": treat the user as having no role.
        // Anything else (backend down, server error) is a real problem to show the user.
        const noProfile = isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)
        setProfileState({ userId, profile: null, error: noProfile ? '' : getErrorMessage(err) })
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  // Only use the profile if it belongs to the user who is logged in now
  const profile = userId && profileState?.userId === userId ? profileState.profile : null
  const profileError = userId && profileState?.userId === userId ? profileState.error : ''
  const profileLoading = Boolean(userId) && profileState?.userId !== userId
  const loading = !sessionChecked || profileLoading

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        profileError,
        loading,
        isAuthenticated: user !== null,
        // After these, onAuthStateChange above updates the state automatically
        login: authService.login,
        register: authService.register,
        logout: authService.logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
