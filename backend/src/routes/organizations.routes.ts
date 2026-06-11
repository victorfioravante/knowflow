import { UserRole } from '@prisma/client'
import { Router } from 'express'
import * as organizations from '../controllers/organizations.controller'
import { requireRole } from '../middlewares/role.middleware'
import { validate } from '../middlewares/validate.middleware'

const router = Router()

router.get('/me', organizations.getMyOrganization)
router.patch(
  '/me',
  requireRole(UserRole.ADMIN),
  validate(organizations.updateOrganizationSchema),
  organizations.updateMyOrganization,
)

export default router
