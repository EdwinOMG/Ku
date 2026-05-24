import { Router } from 'express'
import { getNotifications, markRead } from '../controllers/notifications'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.get('/', requireAuth, getNotifications)
router.put('/read', requireAuth, markRead)

export default router