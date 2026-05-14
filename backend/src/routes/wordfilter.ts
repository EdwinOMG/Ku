import { Router } from 'express'
import { getFilters, addFilter, removeFilter } from '../controllers/wordfilter'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.get('/', requireAuth, getFilters)
router.post('/', requireAuth, addFilter)
router.delete('/:word', requireAuth, removeFilter)

export default router