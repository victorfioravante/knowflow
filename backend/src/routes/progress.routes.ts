import { Router } from 'express'
import * as progress from '../controllers/progress.controller'

const router = Router()

router.post('/deck/:deckId/complete', progress.completeDeck)
router.post('/deck/:deckId/quiz-score', progress.saveDeckQuizScore)

export default router
