import { Router } from 'express'
import { likeKu, unlikeKu } from '../controllers/likes'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.post('/:kuId', requireAuth, likeKu)
router.delete('/:kuId', requireAuth, unlikeKu)

export default router