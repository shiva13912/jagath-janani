import type { AuthUser } from './auth'

// Tells TypeScript that Express requests can carry a `user` property,
// which requireAuth fills in after checking the token.
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export {}
