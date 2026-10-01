import type { Request, Response } from 'express'

// Runs when no route matched the request URL
export function notFound(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  })
}
