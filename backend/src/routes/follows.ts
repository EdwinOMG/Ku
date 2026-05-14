import { Router } from 'express'
import { followUser, unfollowUser } from '../controllers/follows'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.post('/:username', requireAuth, followUser)
router.delete('/:username', requireAuth, unfollowUser)

export default router