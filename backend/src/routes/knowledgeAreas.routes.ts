import { UserRole } from '@prisma/client'
import { Router } from 'express'
import * as areas from '../controllers/knowledgeAreas.controller'
import { requireRole } from '../middlewares/role.middleware'
import { validate } from '../middlewares/validate.middleware'

const router = Router()

router.get('/', areas.listKnowledgeAreas)
router.post(
  '/',
  requireRole(UserRole.ADMIN),
  validate(areas.knowledgeAreaSchema),
  areas.createKnowledgeArea,
)
router.patch(
  '/:id',
  requireRole(UserRole.ADMIN),
  validate(areas.knowledgeAreaSchema.partial()),
  areas.updateKnowledgeArea,
)
router.delete('/:id', requireRole(UserRole.ADMIN), areas.deleteKnowledgeArea)

export default router
