import { Router } from 'express'
import { deleteAlbum, getAlbum, getAlbums, setAlbumCover, updateAlbum } from '../controllers/albumController'
import { getAlbumMedia, requireAlbum, uploadMedia } from '../controllers/mediaController'
import { requireAuth } from '../middleware/authMiddleware'
import { requireRole } from '../middleware/roleMiddleware'
import { uploadMediaFiles } from '../middleware/uploadMiddleware'

// Routes for albums by their own id. Listing and creating the albums of ONE
// event go through the event instead (/api/events/:eventId/albums, in eventRoutes.ts).
const router = Router()

// Anyone (even logged out) can view albums (GET / accepts ?search= and ?eventId=)
router.get('/', getAlbums)
router.get('/:id', getAlbum)

// Team members and admins can edit albums; only admins can delete them.
// The backend enforces this, whatever the frontend shows.
router.put('/:id', requireAuth, requireRole('ADMIN', 'TEAM_MEMBER'), updateAlbum)
// Choosing the album cover counts as editing the album
router.put('/:id/cover', requireAuth, requireRole('ADMIN', 'TEAM_MEMBER'), setAlbumCover)
router.delete('/:id', requireAuth, requireRole('ADMIN'), deleteAlbum)

// Photos and videos of an album. Anyone can view them.
router.get('/:albumId/media', getAlbumMedia)
// Uploading: log in -> team member or admin -> album exists -> receive files -> upload them
router.post('/:albumId/media', requireAuth, requireRole('ADMIN', 'TEAM_MEMBER'), requireAlbum, uploadMediaFiles, uploadMedia)

export default router
