import { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

export const sectorSchema = z.object({
  name: z.string().min(1).max(80),
})

// GET /api/sectors — lista setores da org
export async function listSectors(req: Request, res: Response) {
  const sectors = await prisma.sector.findMany({
    where: { organizationId: req.organization.id },
    orderBy: { name: 'asc' },
    include: { _count: { select: { users: true } } },
  })
  res.json(sectors)
}

// POST /api/sectors — cria setor (ADMIN)
export async function createSector(req: Request, res: Response) {
  const { name } = req.body as z.infer<typeof sectorSchema>
  const sector = await prisma.sector.create({
    data: { name, organizationId: req.organization.id },
  })
  res.status(201).json(sector)
}

// PATCH /api/sectors/:id
export async function updateSector(req: Request, res: Response) {
  const { name } = req.body as z.infer<typeof sectorSchema>
  const existing = await prisma.sector.findFirst({
    where: { id: req.params.id, organizationId: req.organization.id },
  })
  if (!existing) return res.status(404).json({ error: 'Setor não encontrado' })

  const sector = await prisma.sector.update({
    where: { id: existing.id },
    data: { name },
  })
  res.json(sector)
}

// DELETE /api/sectors/:id
export async function deleteSector(req: Request, res: Response) {
  const existing = await prisma.sector.findFirst({
    where: { id: req.params.id, organizationId: req.organization.id },
    include: { _count: { select: { users: true, decks: true, trails: true } } },
  })
  if (!existing) return res.status(404).json({ error: 'Setor não encontrado' })

  const inUse =
    existing._count.users > 0 || existing._count.decks > 0 || existing._count.trails > 0
  if (inUse) {
    return res
      .status(409)
      .json({ error: 'Setor em uso por usuários, decks ou trilhas' })
  }

  await prisma.sector.delete({ where: { id: existing.id } })
  res.status(204).end()
}
