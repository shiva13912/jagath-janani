import { Router } from 'express'
import { createEvent, deleteEvent, getEvent, getEvents, updateEvent } from '../controllers/eventController'
import { requireAuth } from '../middleware/authMiddleware'
import { requireRole } from '../middleware/roleMiddleware'

const router = Router()

// Anyone (even logged out) can view events
router.get('/', getEvents)
router.get('/:id', getEvent)

// Only admins can change events. The backend enforces this, whatever the frontend shows.
router.post('/', requireAuth, requireRole('ADMIN'), createEvent)
router.put('/:id', requireAuth, requireRole('ADMIN'), updateEvent)
router.delete('/:id', requireAuth, requireRole('ADMIN'), deleteEvent)

export default router
