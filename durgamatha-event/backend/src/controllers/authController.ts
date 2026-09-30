import type { Request, Response } from 'express'

// GET /api/auth/me — returns the logged-in user's profile.
// requireAuth has already verified the token and put the user on req.user.
export function getMe(req: Request, res: Response) {
  res.status(200).json({
    success: true,
    profile: req.user,
  })
}
