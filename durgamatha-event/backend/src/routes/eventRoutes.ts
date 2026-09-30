import { Router } from 'express'
import { createAlbum, getEventAlbums } from '../controllers/albumController'
import { createEvent, deleteEvent, getEvent, getEvents, updateEvent } from '../controllers/eventController'
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

export default router
