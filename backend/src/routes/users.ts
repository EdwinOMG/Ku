import { Router } from 'express'
import { getProfile, updateProfile, uploadAvatar } from '../controllers/users'
import { optionalAuth, requireAuth } from '../middleware/auth'

const router = Router()

router.get('/:username', optionalAuth, getProfile)
router.put('/profile', requireAuth, updateProfile)
router.post('/avatar', requireAuth, uploadAvatar)

export default router