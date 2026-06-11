import { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  logoUrl: z.string().url().nullable().optional(),
})

// GET /api/organizations/me — org do usuário autenticado
export async function getMyOrganization(req: Request, res: Response) {
  const organization = await prisma.organization.findUnique({
    where: { id: req.organization.id },
    include: {
      _count: { select: { users: true, decks: true, trails: true } },
    },
  })
  res.json(organization)
}

// PATCH /api/organizations/me — atualiza nome, logo (ADMIN)
export async function updateMyOrganization(req: Request, res: Response) {
  const data = req.body as z.infer<typeof updateOrganizationSchema>
  const organization = await prisma.organization.update({
    where: { id: req.organization.id },
    data,
  })
  res.json(organization)
}
