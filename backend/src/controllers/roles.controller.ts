import { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

export const roleSchema = z.object({
  name: z.string().min(1).max(80),
})

// GET /api/roles — lista cargos da org
export async function listRoles(req: Request, res: Response) {
  const roles = await prisma.role.findMany({
    where: { organizationId: req.organization.id },
    orderBy: { name: 'asc' },
    include: { _count: { select: { users: true } } },
  })
  res.json(roles)
}

// POST /api/roles — cria cargo (ADMIN)
export async function createRole(req: Request, res: Response) {
  const { name } = req.body as z.infer<typeof roleSchema>
  const role = await prisma.role.create({
    data: { name, organizationId: req.organization.id },
  })
  res.status(201).json(role)
}

// PATCH /api/roles/:id
export async function updateRole(req: Request, res: Response) {
  const { name } = req.body as z.infer<typeof roleSchema>
  const existing = await prisma.role.findFirst({
    where: { id: req.params.id, organizationId: req.organization.id },
  })
  if (!existing) return res.status(404).json({ error: 'Cargo não encontrado' })

  const role = await prisma.role.update({
    where: { id: existing.id },
    data: { name },
  })
  res.json(role)
}

// DELETE /api/roles/:id
export async function deleteRole(req: Request, res: Response) {
  const existing = await prisma.role.findFirst({
    where: { id: req.params.id, organizationId: req.organization.id },
    include: { _count: { select: { users: true } } },
  })
  if (!existing) return res.status(404).json({ error: 'Cargo não encontrado' })

  if (existing._count.users > 0) {
    return res.status(409).json({ error: 'Cargo em uso por usuários' })
  }

  await prisma.role.delete({ where: { id: existing.id } })
  res.status(204).end()
}
