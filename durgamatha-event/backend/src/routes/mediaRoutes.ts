import { Router } from 'express'
import { deleteMedia, getGalleryMedia, getMedia } from '../controllers/mediaController'
import { requireAuth } from '../middleware/authMiddleware'
import { requireRole } from '../middleware/roleMiddleware'

// Routes for media across all albums (the public gallery) and for one media item by its id.
// The media of ONE album, and uploading, go through the album instead
// (/api/albums/:albumId/media, see albumRoutes.ts).
const router = Router()

// Anyone can view: the gallery (with filters and pages) and one item
router.get('/', getGalleryMedia)
router.get('/:id', getMedia)

// Only admins can delete media (the same rule as deleting albums)
router.delete('/:id', requireAuth, requireRole('ADMIN'), deleteMedia)

export default router
