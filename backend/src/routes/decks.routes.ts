import { UserRole } from '@prisma/client'
import { Router } from 'express'
import * as decks from '../controllers/decks.controller'
import { requireRole } from '../middlewares/role.middleware'
import { validate } from '../middlewares/validate.middleware'
import storiesRoutes from './stories.routes'

const router = Router()

const CREATOR_ROLES = [UserRole.ADMIN, UserRole.MANAGER, UserRole.CONTRIBUTOR] as const

router.get('/', decks.listDecks)
router.get('/my', decks.listMyDecks)
router.get('/assigned', decks.listAssignedDecks)
router.post(
  '/',
  requireRole(...CREATOR_ROLES),
  validate(decks.createDeckSchema),
  decks.createDeck,
)
router.post(
  '/from-template/:templateId',
  requireRole(...CREATOR_ROLES),
  validate(decks.fromTemplateSchema),
  decks.createFromTemplate,
)
router.get('/:id', decks.getDeck)
router.post('/:id/submit', decks.submitDeck)
router.post(
  '/:id/approve',
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  decks.approveDeck,
)
router.post(
  '/:id/reject',
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validate(decks.rejectDeckSchema),
  decks.rejectDeck,
)
router.post('/:id/redraft', decks.reDraftDeck)
router.patch('/:id', validate(decks.updateDeckSchema), decks.updateDeck)
router.delete('/:id', decks.deleteDeck)

// Stories aninhadas: /api/decks/:deckId/stories
router.use('/:deckId/stories', storiesRoutes)

export default router
