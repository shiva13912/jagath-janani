import { Router } from 'express'
import { getAdmin, getProtected, getTeam } from '../controllers/testController'
import { requireAuth } from '../middleware/authMiddleware'
import { requireRole } from '../middleware/roleMiddleware'

// TEMPORARY routes for testing login and roles. Remove them in a later phase.
const router = Router()

router.get('/protected', requireAuth, getProtected)
router.get('/team', requireAuth, requireRole('ADMIN', 'TEAM_MEMBER'), getTeam)
router.get('/admin', requireAuth, requireRole('ADMIN'), getAdmin)

export default router
