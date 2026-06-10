import { Router } from 'express'
import { likeKu, unlikeKu, getLikers } from '../controllers/likes'
import { requireAuth, optionalAuth } from '../middleware/auth'

const router = Router()

router.post('/:kuId', requireAuth, likeKu)
router.delete('/:kuId', requireAuth, unlikeKu)
router.get('/:kuId', optionalAuth, getLikers)

export default router
