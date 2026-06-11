import { UserRole } from '@prisma/client'
import { Router } from 'express'
import * as sectors from '../controllers/sectors.controller'
import { requireRole } from '../middlewares/role.middleware'
import { validate } from '../middlewares/validate.middleware'

const router = Router()

router.get('/', sectors.listSectors)
router.post('/', requireRole(UserRole.ADMIN), validate(sectors.sectorSchema), sectors.createSector)
router.patch(
  '/:id',
  requireRole(UserRole.ADMIN),
  validate(sectors.sectorSchema),
  sectors.updateSector,
)
router.delete('/:id', requireRole(UserRole.ADMIN), sectors.deleteSector)

export default router
