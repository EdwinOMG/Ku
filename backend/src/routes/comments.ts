import { Router } from 'express'
import { addComment, deleteComment, getComments, likeComment, unlikeComment } from '../controllers/comments'
import { requireAuth, optionalAuth } from '../middleware/auth'

const router = Router()

router.get('/:kuId', optionalAuth, getComments)
router.post('/:kuId', requireAuth, addComment)
router.delete('/:id', requireAuth, deleteComment)
router.post('/:commentId/like', requireAuth, likeComment)
router.delete('/:commentId/like', requireAuth, unlikeComment)

export default router
