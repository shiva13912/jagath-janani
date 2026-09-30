import { Router } from 'express'
import { getMe } from '../controllers/authController'
import { requireAuth } from '../middleware/authMiddleware'

const router = Router()

router.get('/me', requireAuth, getMe)

export default router
