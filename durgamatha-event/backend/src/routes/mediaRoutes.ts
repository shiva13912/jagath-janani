import { Router } from 'express'
import { deleteMedia, getMedia } from '../controllers/mediaController'
import { requireAuth } from '../middleware/authMiddleware'
import { requireRole } from '../middleware/roleMiddleware'

// Routes for one media item by its id. Listing and uploading go through the
// album instead (/api/albums/:albumId/media, see albumRoutes.ts).
const router = Router()

router.get('/:id', getMedia)

// Only admins can delete media (the same rule as deleting albums)
router.delete('/:id', requireAuth, requireRole('ADMIN'), deleteMedia)

export default router
