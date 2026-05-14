import { Router } from 'express'
import { getHashtag } from '../controllers/hashtags'
import { optionalAuth } from '../middleware/auth'

const router = Router()

router.get('/:name', optionalAuth, getHashtag)

export default router