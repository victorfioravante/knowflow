import { UserRole } from '@prisma/client'
import { Router } from 'express'
import * as users from '../controllers/users.controller'
import { requireRole } from '../middlewares/role.middleware'
import { validate } from '../middlewares/validate.middleware'

const router = Router()

router.get('/', users.listUsers)
router.get('/:id', users.getUser)
router.patch(
  '/:id',
  requireRole(UserRole.ADMIN),
  validate(users.updateUserSchema),
  users.updateUser,
)
router.delete('/:id', requireRole(UserRole.ADMIN), users.deleteUser)

export default router
