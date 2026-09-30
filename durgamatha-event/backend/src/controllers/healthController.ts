import type { Request, Response } from 'express'

// GET /api/health — a quick way to check that the API is up
export function getHealth(_req: Request, res: Response) {
  res.status(200).json({
    success: true,
    message: 'Durgamatha API is running',
  })
}
