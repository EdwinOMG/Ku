import { Router } from 'express'
import { searchUsers, searchHashtags } from '../controllers/search'
import { optionalAuth } from '../middleware/auth'

const router = Router()

router.get('/users', optionalAuth, searchUsers)
router.get('/hashtags', optionalAuth, searchHashtags)

export default router