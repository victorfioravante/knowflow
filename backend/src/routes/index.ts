import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import authRoutes from './auth.routes'
import knowledgeAreasRoutes from './knowledgeAreas.routes'
import organizationsRoutes from './organizations.routes'
import rolesRoutes from './roles.routes'
import sectorsRoutes from './sectors.routes'
import usersRoutes from './users.routes'

const router = Router()

// Rotas públicas / com auth própria
router.use('/auth', authRoutes)

// Rotas autenticadas (toda query é filtrada por organizationId via req.organization)
router.use('/organizations', authMiddleware, organizationsRoutes)
router.use('/sectors', authMiddleware, sectorsRoutes)
router.use('/roles', authMiddleware, rolesRoutes)
router.use('/knowledge-areas', authMiddleware, knowledgeAreasRoutes)
router.use('/users', authMiddleware, usersRoutes)

export default router
