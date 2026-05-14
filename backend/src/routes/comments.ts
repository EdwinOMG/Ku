import { Router } from 'express'
import { addComment, deleteComment, getComments } from '../controllers/comments'
import { requireAuth, optionalAuth } from '../middleware/auth'

const router = Router()

router.get('/:kuId', optionalAuth, getComments)
router.post('/:kuId', requireAuth, addComment)
router.delete('/:id', requireAuth, deleteComment)

export default router