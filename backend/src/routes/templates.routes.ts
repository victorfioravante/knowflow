import { Router } from 'express'
import * as templates from '../controllers/templates.controller'

const router = Router()

router.get('/', templates.listTemplates)
router.get('/:id', templates.getTemplate)

export default router
