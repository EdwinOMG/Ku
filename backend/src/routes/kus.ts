import { Router } from 'express'
import {
  createKu,
  deleteKu,
  getHomeFeed,
  getExploreFeed,
  getDailyFeed,
  getKu
} from '../controllers/kus'
import { requireAuth, optionalAuth } from '../middleware/auth'

const router = Router()

router.get('/feed/home', requireAuth, getHomeFeed)
router.get('/feed/explore', optionalAuth, getExploreFeed)
router.get('/feed/daily', optionalAuth, getDailyFeed)
router.get('/:id', optionalAuth, getKu)
router.post('/', requireAuth, createKu)
router.delete('/:id', requireAuth, deleteKu)

export default router