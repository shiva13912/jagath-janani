import type { NextFunction, Request, Response } from 'express'
import type { Role } from '../types/auth'

// Allows the request only if the logged-in user has one of the given roles.
// Always use it AFTER requireAuth, which sets req.user:
//   router.get('/admin', requireAuth, requireRole('ADMIN'), handler)
//   router.get('/team', requireAuth, requireRole('ADMIN', 'TEAM_MEMBER'), handler)
export function requireRole(...allowedRoles: Role[]) {
  // requireRole(...) returns the actual middleware function Express will run
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      // requireAuth was not run before this middleware
      res.status(401).json({ success: false, message: 'Not logged in' })
      return
    }

    if (!allowedRoles.includes(req.user.role)) {
      // Logged in, but not allowed: 403 Forbidden
      res.status(403).json({ success: false, message: 'You do not have permission to do this' })
      return
    }

    next()
  }
}
