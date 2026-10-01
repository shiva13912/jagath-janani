import cors from 'cors'
import express from 'express'
import { env } from './config/env'
import { errorHandler } from './middleware/errorHandler'
import { notFound } from './middleware/notFound'
import apiRoutes from './routes'

const app = express()

// Allow the frontend (running on a different port/domain) to call this API
app.use(cors({ origin: env.frontendUrl }))

// Lets us read JSON sent in request bodies as req.body
app.use(express.json())

// All API routes start with /api
app.use('/api', apiRoutes)

// These two must come last: first "not found", then the error handler
app.use(notFound)
app.use(errorHandler)

export default app
