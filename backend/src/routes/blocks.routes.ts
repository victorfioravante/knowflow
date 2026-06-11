import { Router } from 'express'
import * as blocks from '../controllers/blocks.controller'
import { validate } from '../middlewares/validate.middleware'

// mergeParams para acessar :storyId da rota pai
const router = Router({ mergeParams: true })

router.get('/', blocks.listBlocks)
router.post('/', validate(blocks.createBlockSchema), blocks.createBlock)
router.patch('/reorder', validate(blocks.reorderBlocksSchema), blocks.reorderBlocks)
router.patch('/:id', validate(blocks.updateBlockSchema), blocks.updateBlock)
router.delete('/:id', blocks.deleteBlock)

export default router
