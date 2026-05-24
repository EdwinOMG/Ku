import { Router } from 'express'
import {
  createOpenWrite,
  deleteOpenWrite,
  getOpenWrite,
  updateOpenWrite
} from '../controllers/openwrites'
import { requireAuth, optionalAuth } from '../middleware/auth'

const router = Router()

router.get('/:id', optionalAuth, getOpenWrite)
router.post('/', requireAuth, createOpenWrite)
router.put('/:id', requireAuth, updateOpenWrite)
router.delete('/:id', requireAuth, deleteOpenWrite)

export default router