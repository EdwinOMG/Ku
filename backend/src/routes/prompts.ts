import { Router } from 'express'
import { setDailyPrompt } from '../controllers/prompts'
import { requireAuth, requireMod } from '../middleware/auth'

const router = Router()

router.post('/', requireAuth, requireMod, setDailyPrompt)

export default router