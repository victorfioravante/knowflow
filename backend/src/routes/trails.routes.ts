import { UserRole } from '@prisma/client'
import { Router } from 'express'
import * as trails from '../controllers/trails.controller'
import { requireRole } from '../middlewares/role.middleware'
import { validate } from '../middlewares/validate.middleware'

const router = Router()

const MANAGER_ROLES = [UserRole.ADMIN, UserRole.MANAGER] as const

router.get('/', trails.listTrails)
router.get('/:id', trails.getTrail)

router.post('/', requireRole(...MANAGER_ROLES), validate(trails.createTrailSchema), trails.createTrail)
router.patch('/:id', requireRole(...MANAGER_ROLES), validate(trails.updateTrailSchema), trails.updateTrail)
router.put('/:id/items', requireRole(...MANAGER_ROLES), validate(trails.setTrailItemsSchema), trails.setTrailItems)
router.post('/:id/assign', requireRole(...MANAGER_ROLES), validate(trails.assignTrailSchema), trails.assignTrail)
router.delete('/:id', requireRole(...MANAGER_ROLES), trails.deleteTrail)

export default router
