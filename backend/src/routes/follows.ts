import { Router } from 'express'
import { followUser, unfollowUser, getFollowers, getFollowing, removeFollower } from '../controllers/follows'
import { requireAuth, optionalAuth } from '../middleware/auth'

const router = Router()

router.post('/:username', requireAuth, followUser)
router.delete('/:username', requireAuth, unfollowUser)
router.get('/:username/followers', optionalAuth, getFollowers)
router.get('/:username/following', optionalAuth, getFollowing)
router.delete('/:username/remove', requireAuth, removeFollower)

export default router
