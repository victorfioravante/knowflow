import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import authRoutes from './auth.routes'
import blocksRoutes from './blocks.routes'
import decksRoutes from './decks.routes'
import knowledgeAreasRoutes from './knowledgeAreas.routes'
import organizationsRoutes from './organizations.routes'
import rolesRoutes from './roles.routes'
import sectorsRoutes from './sectors.routes'
import templatesRoutes from './templates.routes'
import uploadsRoutes from './uploads.routes'
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
router.use('/decks', authMiddleware, decksRoutes)
router.use('/stories/:storyId/blocks', authMiddleware, blocksRoutes)
router.use('/templates', authMiddleware, templatesRoutes)
router.use('/uploads', authMiddleware, uploadsRoutes)

export default router
