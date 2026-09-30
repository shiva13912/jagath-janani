import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env'

// An error may carry its own HTTP status (for example 400 when the request body is invalid JSON)
type HttpError = Error & { status?: number }

// Express knows this is the error handler because it has 4 parameters.
// Any error thrown in a route ends up here, so every error response has the same shape.
export function errorHandler(err: HttpError, _req: Request, res: Response, _next: NextFunction) {
  // Only trust err.status if it is a real HTTP error code (400-599); otherwise it's our fault: 500
  const statusCode = err.status && err.status >= 400 && err.status < 600 ? err.status : 500

  // 500 = a bug on our side, so log it for debugging
  if (statusCode >= 500) {
    console.error(err)
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 ? 'Something went wrong on the server' : err.message,
    // Only show the real error message while developing, never in production
    ...(env.nodeEnv === 'development' && statusCode >= 500 && { error: err.message }),
  })
}
