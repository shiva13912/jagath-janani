import { Router } from 'express'
import { deleteExpense, getAllExpenses, getExpense, updateExpense } from '../controllers/expenseController'
import { requireAuth } from '../middleware/authMiddleware'
import { requireRole } from '../middleware/roleMiddleware'

const router = Router()

// Every expense route needs a login. The public never sees financial data.
router.use(requireAuth)

// Admins and team members can VIEW expenses
router.get('/', requireRole('ADMIN', 'TEAM_MEMBER'), getAllExpenses)
router.get('/:id', requireRole('ADMIN', 'TEAM_MEMBER'), getExpense)

// Only admins can CHANGE expenses. Hiding the buttons is not enough: the backend refuses (403).
// (Adding an expense is POST /api/events/:eventId/expenses, in eventRoutes.ts)
router.put('/:id', requireRole('ADMIN'), updateExpense)
router.delete('/:id', requireRole('ADMIN'), deleteExpense)

export default router
