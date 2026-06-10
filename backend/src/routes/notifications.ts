import { Router } from 'express'
import { getNotifications, getUnreadCount, markRead } from '../controllers/notifications'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.get('/', requireAuth, getNotifications)
router.get('/unread', requireAuth, getUnreadCount)
router.put('/read', requireAuth, markRead)

export default router
