import { Router } from 'express'
import { deleteIncome, getAllIncome, getIncome, updateIncome } from '../controllers/incomeController'
import { requireAuth } from '../middleware/authMiddleware'
import { requireRole } from '../middleware/roleMiddleware'

const router = Router()

// Every income route needs a login. The public never sees financial data.
router.use(requireAuth)

// Admins and team members can VIEW income
router.get('/', requireRole('ADMIN', 'TEAM_MEMBER'), getAllIncome)
router.get('/:id', requireRole('ADMIN', 'TEAM_MEMBER'), getIncome)

// Only admins can CHANGE income. Hiding the buttons is not enough: the backend refuses (403).
// (Adding income is POST /api/events/:eventId/income, in eventRoutes.ts)
router.put('/:id', requireRole('ADMIN'), updateIncome)
router.delete('/:id', requireRole('ADMIN'), deleteIncome)

export default router
