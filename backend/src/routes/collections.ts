import { Router } from 'express'
import {
  createCollection,
  deleteCollection,
  addKuToCollection,
  removeKuFromCollection,
  getCollection,
  updateCollection,
  getUserCollections
} from '../controllers/collections'
import { requireAuth, optionalAuth } from '../middleware/auth'

const router = Router()

router.get('/mine', requireAuth, getUserCollections)
router.get('/:id', optionalAuth, getCollection)
router.post('/', requireAuth, createCollection)
router.put('/:id', requireAuth, updateCollection)
router.delete('/:id', requireAuth, deleteCollection)
router.post('/:id/kus/:kuId', requireAuth, addKuToCollection)
router.delete('/:id/kus/:kuId', requireAuth, removeKuFromCollection)

export default router