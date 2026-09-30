import { Router } from 'express'
import albumRoutes from './albumRoutes'
import authRoutes from './authRoutes'
import dashboardRoutes from './dashboardRoutes'
import eventRoutes from './eventRoutes'
import expenseRoutes from './expenseRoutes'
import healthRoutes from './healthRoutes'
import incomeRoutes from './incomeRoutes'
import mediaRoutes from './mediaRoutes'
import testRoutes from './testRoutes'

// Every API route is registered here. app.ts mounts this router at /api,
// so '/health' below becomes '/api/health'.
const router = Router()

router.use('/health', healthRoutes)
router.use('/auth', authRoutes)
router.use('/events', eventRoutes)
router.use('/albums', albumRoutes)
router.use('/media', mediaRoutes)
router.use('/income', incomeRoutes)
router.use('/expenses', expenseRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/test', testRoutes) // temporary, for testing roles

export default router
