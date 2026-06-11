import { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

export const knowledgeAreaSchema = z.object({
  name: z.string().min(1).max(80),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Cor deve ser hex no formato #RRGGBB')
    .optional(),
  icon: z.string().max(60).nullable().optional(),
})

// GET /api/knowledge-areas
export async function listKnowledgeAreas(req: Request, res: Response) {
  const areas = await prisma.knowledgeArea.findMany({
    where: { organizationId: req.organization.id },
    orderBy: { name: 'asc' },
    include: { _count: { select: { decks: true } } },
  })
  res.json(areas)
}

// POST /api/knowledge-areas (ADMIN)
export async function createKnowledgeArea(req: Request, res: Response) {
  const data = req.body as z.infer<typeof knowledgeAreaSchema>
  const area = await prisma.knowledgeArea.create({
    data: { ...data, organizationId: req.organization.id },
  })
  res.status(201).json(area)
}

// PATCH /api/knowledge-areas/:id
export async function updateKnowledgeArea(req: Request, res: Response) {
  const data = req.body as z.infer<typeof knowledgeAreaSchema>
  const existing = await prisma.knowledgeArea.findFirst({
    where: { id: req.params.id, organizationId: req.organization.id },
  })
  if (!existing) return res.status(404).json({ error: 'Área não encontrada' })

  const area = await prisma.knowledgeArea.update({
    where: { id: existing.id },
    data,
  })
  res.json(area)
}

// DELETE /api/knowledge-areas/:id
export async function deleteKnowledgeArea(req: Request, res: Response) {
  const existing = await prisma.knowledgeArea.findFirst({
    where: { id: req.params.id, organizationId: req.organization.id },
    include: { _count: { select: { decks: true } } },
  })
  if (!existing) return res.status(404).json({ error: 'Área não encontrada' })

  if (existing._count.decks > 0) {
    return res.status(409).json({ error: 'Área em uso por decks' })
  }

  await prisma.knowledgeArea.delete({ where: { id: existing.id } })
  res.status(204).end()
}
