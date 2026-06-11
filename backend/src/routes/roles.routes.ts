import { UserRole } from '@prisma/client'
import { Router } from 'express'
import * as roles from '../controllers/roles.controller'
import { requireRole } from '../middlewares/role.middleware'
import { validate } from '../middlewares/validate.middleware'

const router = Router()

router.get('/', roles.listRoles)
router.post('/', requireRole(UserRole.ADMIN), validate(roles.roleSchema), roles.createRole)
router.patch('/:id', requireRole(UserRole.ADMIN), validate(roles.roleSchema), roles.updateRole)
router.delete('/:id', requireRole(UserRole.ADMIN), roles.deleteRole)

export default router
