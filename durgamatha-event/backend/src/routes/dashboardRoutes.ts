import { Router } from 'express'
import { getDashboardSummary } from '../controllers/dashboardController'
import { requireAuth } from '../middleware/authMiddleware'
import { requireRole } from '../middleware/roleMiddleware'

const router = Router()

// The dashboard includes money, so only admins and team members can see it
router.get('/summary', requireAuth, requireRole('ADMIN', 'TEAM_MEMBER'), getDashboardSummary)

export default router
