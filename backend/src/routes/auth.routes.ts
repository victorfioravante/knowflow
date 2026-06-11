import { UserRole } from '@prisma/client'
import { Router } from 'express'
import * as auth from '../controllers/auth.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { requireRole } from '../middlewares/role.middleware'
import { validate } from '../middlewares/validate.middleware'

const router = Router()

router.post('/verify', auth.verify)
router.post(
  '/invite',
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  validate(auth.inviteSchema),
  auth.invite,
)
router.post('/accept-invite/:token', auth.acceptInvite)

export default router
