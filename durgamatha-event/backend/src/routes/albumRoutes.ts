import { Router } from 'express'
import { deleteAlbum, getAlbum, getAlbums, updateAlbum } from '../controllers/albumController'
import { requireAuth } from '../middleware/authMiddleware'
import { requireRole } from '../middleware/roleMiddleware'

// Routes for albums by their own id. Listing and creating the albums of ONE
// event go through the event instead (/api/events/:eventId/albums, in eventRoutes.ts).
const router = Router()

// Anyone (even logged out) can view albums
router.get('/', getAlbums)
router.get('/:id', getAlbum)

// Team members and admins can edit albums; only admins can delete them.
// The backend enforces this, whatever the frontend shows.
router.put('/:id', requireAuth, requireRole('ADMIN', 'TEAM_MEMBER'), updateAlbum)
router.delete('/:id', requireAuth, requireRole('ADMIN'), deleteAlbum)

export default router
