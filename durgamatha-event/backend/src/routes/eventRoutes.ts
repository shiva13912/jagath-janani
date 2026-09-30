import { Router } from 'express'
import { createAlbum, getEventAlbums } from '../controllers/albumController'
import { getEventDashboardSummary, getEventFinancialSummary } from '../controllers/dashboardController'
import { createEvent, deleteEvent, getEvent, getEvents, updateEvent } from '../controllers/eventController'
import { createExpense, getEventExpenses } from '../controllers/expenseController'
import { createIncome, getEventIncome } from '../controllers/incomeController'
import { requireAuth } from '../middleware/authMiddleware'
import { requireRole } from '../middleware/roleMiddleware'

const router = Router()

// Anyone (even logged out) can view events
router.get('/', getEvents)
router.get('/:id', getEvent)
router.get('/:eventId/albums', getEventAlbums)

// Only admins can change events. The backend enforces this, whatever the frontend shows.
router.post('/', requireAuth, requireRole('ADMIN'), createEvent)
router.put('/:id', requireAuth, requireRole('ADMIN'), updateEvent)
router.delete('/:id', requireAuth, requireRole('ADMIN'), deleteEvent)

// Team members and admins can add albums to an event
router.post('/:eventId/albums', requireAuth, requireRole('ADMIN', 'TEAM_MEMBER'), createAlbum)

// Finance for one event: admins and team members can view it, only admins can add to it.
// The public (and logged-out visitors) get 401/403 from the backend.
const viewFinance = [requireAuth, requireRole('ADMIN', 'TEAM_MEMBER')]
router.get('/:eventId/income', ...viewFinance, getEventIncome)
router.get('/:eventId/expenses', ...viewFinance, getEventExpenses)
router.get('/:eventId/financial-summary', ...viewFinance, getEventFinancialSummary)
router.get('/:eventId/dashboard-summary', ...viewFinance, getEventDashboardSummary)
router.post('/:eventId/income', requireAuth, requireRole('ADMIN'), createIncome)
router.post('/:eventId/expenses', requireAuth, requireRole('ADMIN'), createExpense)

export default router
