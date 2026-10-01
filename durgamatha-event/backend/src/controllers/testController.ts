import type { Request, Response } from 'express'

// TEMPORARY endpoints for testing login and roles. Remove them in a later phase.

// GET /api/test/protected — any logged-in user
export function getProtected(req: Request, res: Response) {
  res.status(200).json({ success: true, message: `Hello ${req.user?.fullName}, you are logged in`, role: req.user?.role })
}

// GET /api/test/team — TEAM_MEMBER or ADMIN
export function getTeam(req: Request, res: Response) {
  res.status(200).json({ success: true, message: 'Welcome to the team area', role: req.user?.role })
}

// GET /api/test/admin — ADMIN only
export function getAdmin(req: Request, res: Response) {
  res.status(200).json({ success: true, message: 'Welcome to the admin area', role: req.user?.role })
}
