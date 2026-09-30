import { Router } from 'express'
import authRoutes from './authRoutes'
import healthRoutes from './healthRoutes'
import testRoutes from './testRoutes'

// Every API route is registered here. app.ts mounts this router at /api,
// so '/health' below becomes '/api/health'.
const router = Router()

router.use('/health', healthRoutes)
router.use('/auth', authRoutes)
router.use('/test', testRoutes) // temporary, for testing roles

export default router
