import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

// GET /api/templates — lista templates (plataforma + org)
export async function listTemplates(req: Request, res: Response) {
  const templates = await prisma.template.findMany({
    where: {
      OR: [{ organizationId: null }, { organizationId: req.organization.id }],
    },
    orderBy: [{ source: 'asc' }, { name: 'asc' }],
  })
  res.json(templates)
}

// GET /api/templates/:id
export async function getTemplate(req: Request, res: Response) {
  const template = await prisma.template.findFirst({
    where: {
      id: req.params.id,
      OR: [{ organizationId: null }, { organizationId: req.organization.id }],
    },
  })
  if (!template) return res.status(404).json({ error: 'Template não encontrado' })
  res.json(template)
}
