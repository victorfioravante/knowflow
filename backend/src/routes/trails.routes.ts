import { Router } from 'express'
import * as trails from '../controllers/trails.controller'

const router = Router()

router.get('/', trails.listTrails)
router.get('/:id', trails.getTrail)

export default router
