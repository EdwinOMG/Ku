import { Router } from 'express'
import { submitReport, getReports, updateReportStatus } from '../controllers/reports'
import { requireAuth, requireMod } from '../middleware/auth'

const router = Router()

router.post('/', requireAuth, submitReport)
router.get('/', requireAuth, requireMod, getReports)
router.put('/:id', requireAuth, requireMod, updateReportStatus)

export default router