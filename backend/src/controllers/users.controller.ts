import { UserRole } from '@prisma/client'
import { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { supabase } from '../lib/supabase'

export const updateUserSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  role: z.nativeEnum(UserRole).optional(),
  sectorId: z.string().cuid().nullable().optional(),
  roleId: z.string().cuid().nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
})

const userSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  role: true,
  sectorId: true,
  roleId: true,
  createdAt: true,
  sector: { select: { id: true, name: true } },
  jobRole: { select: { id: true, name: true } },
} as const

// GET /api/users — lista usuários da org
export async function listUsers(req: Request, res: Response) {
  const users = await prisma.user.findMany({
    where: { organizationId: req.organization.id },
    orderBy: { name: 'asc' },
    select: userSelect,
  })
  res.json(users)
}

// GET /api/users/:id
export async function getUser(req: Request, res: Response) {
  const user = await prisma.user.findFirst({
    where: { id: req.params.id, organizationId: req.organization.id },
    select: userSelect,
  })
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' })
  res.json(user)
}

// PATCH /api/users/:id — atualiza role, setor, cargo (ADMIN)
export async function updateUser(req: Request, res: Response) {
  const data = req.body as z.infer<typeof updateUserSchema>
  const organizationId = req.organization.id

  const existing = await prisma.user.findFirst({
    where: { id: req.params.id, organizationId },
  })
  if (!existing) return res.status(404).json({ error: 'Usuário não encontrado' })

  // Setor e cargo devem pertencer à mesma organização
  if (data.sectorId) {
    const sector = await prisma.sector.findFirst({
      where: { id: data.sectorId, organizationId },
    })
    if (!sector) return res.status(400).json({ error: 'Setor inválido' })
  }
  if (data.roleId) {
    const jobRole = await prisma.role.findFirst({
      where: { id: data.roleId, organizationId },
    })
    if (!jobRole) return res.status(400).json({ error: 'Cargo inválido' })
  }

  // Impede a org de ficar sem admin
  if (existing.role === UserRole.ADMIN && data.role && data.role !== UserRole.ADMIN) {
    const adminCount = await prisma.user.count({
      where: { organizationId, role: UserRole.ADMIN },
    })
    if (adminCount <= 1) {
      return res.status(409).json({ error: 'A organização precisa de pelo menos um admin' })
    }
  }

  const user = await prisma.user.update({
    where: { id: existing.id },
    data,
    select: userSelect,
  })
  res.json(user)
}

// DELETE /api/users/:id (ADMIN)
export async function deleteUser(req: Request, res: Response) {
  const organizationId = req.organization.id
  const existing = await prisma.user.findFirst({
    where: { id: req.params.id, organizationId },
  })
  if (!existing) return res.status(404).json({ error: 'Usuário não encontrado' })

  if (existing.id === req.user.id) {
    return res.status(409).json({ error: 'Não é possível remover a si mesmo' })
  }
  if (existing.role === UserRole.ADMIN) {
    const adminCount = await prisma.user.count({
      where: { organizationId, role: UserRole.ADMIN },
    })
    if (adminCount <= 1) {
      return res.status(409).json({ error: 'A organização precisa de pelo menos um admin' })
    }
  }

  await prisma.user.delete({ where: { id: existing.id } })
  // Remove também o usuário do Supabase Auth (não bloqueia em caso de falha)
  await supabase.auth.admin.deleteUser(existing.supabaseId).catch(() => undefined)

  res.status(204).end()
}
