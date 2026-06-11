import { Router } from 'express'
import * as stories from '../controllers/stories.controller'
import { validate } from '../middlewares/validate.middleware'

// mergeParams para acessar :deckId da rota pai
const router = Router({ mergeParams: true })

router.get('/', stories.listStories)
router.post('/', stories.createStory)
router.patch('/reorder', validate(stories.reorderStoriesSchema), stories.reorderStories)
router.patch('/:id', stories.updateStory)
router.delete('/:id', stories.deleteStory)

export default router
