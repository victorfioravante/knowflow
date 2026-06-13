import { AssignmentTargetType } from '@prisma/client'
import { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

export interface TrailItemProgressInput {
  deckId: string
  order: number
  required: boolean
}

export interface TrailProgressSummary {
  total: number
  completed: number
  percent: number
  nextDeckId: string | null
  isComplete: boolean
}

/**
 * Resume o progresso de um usuário numa trilha (lógica pura, sem banco).
 * - completed: itens cujo deck já foi concluído
 * - nextDeckId: primeiro item ainda não concluído, na ordem
 * - isComplete: todos os itens obrigatórios concluídos
 */
export function computeTrailProgress(
  items: TrailItemProgressInput[],
  completedDeckIds: Set<string>,
): TrailProgressSummary {
  const sorted = [...items].sort((a, b) => a.order - b.order)
  const total = sorted.length
  const completed = sorted.filter((i) => completedDeckIds.has(i.deckId)).length
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)
  const next = sorted.find((i) => !completedDeckIds.has(i.deckId))
  const isComplete = sorted.every((i) => !i.required || completedDeckIds.has(i.deckId))
  return { total, completed, percent, nextDeckId: next?.deckId ?? null, isComplete }
}

/** Decks concluídos pelo usuário, como Set de ids, para o cálculo de progresso. */
async function completedDeckIdsFor(userId: string, deckIds?: string[]) {
  const progresses = await prisma.deckProgress.findMany({
    where: {
      userId,
      completedAt: { not: null },
      ...(deckIds ? { deckId: { in: deckIds } } : {}),
    },
    select: { deckId: true },
  })
  return new Set(progresses.map((p) => p.deckId))
}

// GET /api/trails — lista trilhas da org com progresso do usuário (onboarding primeiro)
export async function listTrails(req: Request, res: Response) {
  const trails = await prisma.trail.findMany({
    where: { organizationId: req.organization.id },
    orderBy: [{ isOnboarding: 'desc' }, { createdAt: 'asc' }],
    include: {
      sector: { select: { id: true, name: true } },
      items: { select: { deckId: true, order: true, required: true } },
    },
  })

  const completedIds = await completedDeckIdsFor(req.user.id)

  res.json(
    trails.map(({ items, ...trail }) => ({
      ...trail,
      itemCount: items.length,
      progress: computeTrailProgress(items, completedIds),
    })),
  )
}

// GET /api/trails/:id — trilha com itens (deck + progresso) e desbloqueio sequencial
export async function getTrail(req: Request, res: Response) {
  const trail = await prisma.trail.findFirst({
    where: { id: req.params.id, organizationId: req.organization.id },
    include: {
      sector: { select: { id: true, name: true } },
      items: {
        orderBy: { order: 'asc' },
        include: {
          deck: {
            select: {
              id: true,
              title: true,
              description: true,
              coverColor: true,
              status: true,
              knowledgeArea: { select: { id: true, name: true, color: true } },
              _count: { select: { stories: true } },
            },
          },
        },
      },
    },
  })
  if (!trail) return res.status(404).json({ error: 'Trilha não encontrada' })

  const completedIds = await completedDeckIdsFor(
    req.user.id,
    trail.items.map((i) => i.deckId),
  )

  const progress = computeTrailProgress(
    trail.items.map((i) => ({ deckId: i.deckId, order: i.order, required: i.required })),
    completedIds,
  )

  // Em trilha sequencial, um passo só desbloqueia quando todos os anteriores foram concluídos.
  let prevCompleted = true
  const items = trail.items.map((item) => {
    const isCompleted = completedIds.has(item.deckId)
    const unlocked = trail.sequential ? prevCompleted : true
    prevCompleted = prevCompleted && isCompleted
    return { ...item, completed: isCompleted, unlocked }
  })

  res.json({ ...trail, items, progress })
}

// ─── CRUD (MANAGER+) ───────────────────────────────────────────────────────────

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/)

export const createTrailSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(500).nullable().optional(),
  coverColor: hexColor.optional(),
  isOnboarding: z.boolean().optional(),
  sequential: z.boolean().optional(),
  sectorId: z.string().cuid().nullable().optional(),
  deckIds: z.array(z.string().cuid()).optional(),
})

export const updateTrailSchema = createTrailSchema.partial()

export const setTrailItemsSchema = z.object({
  items: z
    .array(z.object({ deckId: z.string().cuid(), required: z.boolean().optional() }))
    .max(50),
})

export const assignTrailSchema = z.object({
  targetType: z.nativeEnum(AssignmentTargetType),
  targetId: z.string().min(1).optional(),
  dueDate: z.string().datetime().nullable().optional(),
})

export interface TrailItemInput {
  deckId: string
  required?: boolean
}

/**
 * Normaliza itens de trilha (lógica pura): remove decks duplicados (mantendo a
 * primeira ocorrência) e atribui a ordem sequencial pela posição na lista.
 */
export function normalizeTrailItems(
  items: TrailItemInput[],
): { deckId: string; order: number; required: boolean }[] {
  const seen = new Set<string>()
  const result: { deckId: string; order: number; required: boolean }[] = []
  for (const item of items) {
    if (seen.has(item.deckId)) continue
    seen.add(item.deckId)
    result.push({ deckId: item.deckId, order: result.length, required: item.required ?? true })
  }
  return result
}

function findOrgTrail(trailId: string, organizationId: string) {
  return prisma.trail.findFirst({ where: { id: trailId, organizationId } })
}

/** Garante que todos os decks pertencem à org (e existem). */
async function decksBelongToOrg(deckIds: string[], organizationId: string) {
  const unique = [...new Set(deckIds)]
  if (unique.length === 0) return true
  const count = await prisma.deck.count({ where: { id: { in: unique }, organizationId } })
  return count === unique.length
}

async function sectorBelongsToOrg(sectorId: string, organizationId: string) {
  const sector = await prisma.sector.findFirst({ where: { id: sectorId, organizationId } })
  return Boolean(sector)
}

// POST /api/trails — cria trilha (MANAGER+)
export async function createTrail(req: Request, res: Response) {
  const data = req.body as z.infer<typeof createTrailSchema>
  const organizationId = req.organization.id

  if (data.sectorId && !(await sectorBelongsToOrg(data.sectorId, organizationId))) {
    return res.status(400).json({ error: 'Setor inválido' })
  }

  const items = data.deckIds ? normalizeTrailItems(data.deckIds.map((deckId) => ({ deckId }))) : []
  if (items.length && !(await decksBelongToOrg(items.map((i) => i.deckId), organizationId))) {
    return res.status(400).json({ error: 'Um ou mais decks são inválidos' })
  }

  const trail = await prisma.trail.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      coverColor: data.coverColor ?? '#1D9E75',
      isOnboarding: data.isOnboarding ?? false,
      sequential: data.sequential ?? true,
      sectorId: data.sectorId ?? null,
      organizationId,
      items: { create: items },
    },
    include: { items: { orderBy: { order: 'asc' } } },
  })
  res.status(201).json(trail)
}

// PATCH /api/trails/:id — atualiza campos da trilha (MANAGER+)
export async function updateTrail(req: Request, res: Response) {
  const data = req.body as z.infer<typeof updateTrailSchema>
  const organizationId = req.organization.id

  const trail = await findOrgTrail(req.params.id, organizationId)
  if (!trail) return res.status(404).json({ error: 'Trilha não encontrada' })

  if (data.sectorId && !(await sectorBelongsToOrg(data.sectorId, organizationId))) {
    return res.status(400).json({ error: 'Setor inválido' })
  }

  const updated = await prisma.trail.update({
    where: { id: trail.id },
    data: {
      title: data.title,
      description: data.description,
      coverColor: data.coverColor,
      isOnboarding: data.isOnboarding,
      sequential: data.sequential,
      sectorId: data.sectorId,
    },
    include: { items: { orderBy: { order: 'asc' } } },
  })
  res.json(updated)
}

// PUT /api/trails/:id/items — substitui os decks da trilha, na ordem dada (MANAGER+)
export async function setTrailItems(req: Request, res: Response) {
  const { items } = req.body as z.infer<typeof setTrailItemsSchema>
  const organizationId = req.organization.id

  const trail = await findOrgTrail(req.params.id, organizationId)
  if (!trail) return res.status(404).json({ error: 'Trilha não encontrada' })

  const normalized = normalizeTrailItems(items)
  if (!(await decksBelongToOrg(normalized.map((i) => i.deckId), organizationId))) {
    return res.status(400).json({ error: 'Um ou mais decks são inválidos' })
  }

  await prisma.$transaction([
    prisma.trailItem.deleteMany({ where: { trailId: trail.id } }),
    prisma.trailItem.createMany({
      data: normalized.map((i) => ({ ...i, trailId: trail.id })),
    }),
  ])

  const updated = await prisma.trail.findUnique({
    where: { id: trail.id },
    include: { items: { orderBy: { order: 'asc' }, include: { deck: { select: { id: true, title: true } } } } },
  })
  res.json(updated)
}

// DELETE /api/trails/:id (MANAGER+)
export async function deleteTrail(req: Request, res: Response) {
  const trail = await findOrgTrail(req.params.id, req.organization.id)
  if (!trail) return res.status(404).json({ error: 'Trilha não encontrada' })

  await prisma.trail.delete({ where: { id: trail.id } })
  res.status(204).end()
}

// POST /api/trails/:id/assign — atribui a trilha a um usuário, setor ou à org (MANAGER+)
export async function assignTrail(req: Request, res: Response) {
  const { targetType, targetId, dueDate } = req.body as z.infer<typeof assignTrailSchema>
  const organizationId = req.organization.id

  const trail = await findOrgTrail(req.params.id, organizationId)
  if (!trail) return res.status(404).json({ error: 'Trilha não encontrada' })

  // Resolve e valida o alvo conforme o tipo
  let resolvedTargetId: string
  if (targetType === AssignmentTargetType.ORGANIZATION) {
    resolvedTargetId = organizationId
  } else if (targetType === AssignmentTargetType.SECTOR) {
    if (!targetId || !(await sectorBelongsToOrg(targetId, organizationId))) {
      return res.status(400).json({ error: 'Setor inválido' })
    }
    resolvedTargetId = targetId
  } else {
    // USER
    const user =
      targetId &&
      (await prisma.user.findFirst({ where: { id: targetId, organizationId } }))
    if (!user) return res.status(400).json({ error: 'Usuário inválido' })
    resolvedTargetId = targetId!
  }

  // Idempotente: não duplica a mesma atribuição
  const existing = await prisma.assignment.findFirst({
    where: { trailId: trail.id, targetType, targetId: resolvedTargetId },
  })
  if (existing) return res.json(existing)

  const assignment = await prisma.assignment.create({
    data: {
      trailId: trail.id,
      targetType,
      targetId: resolvedTargetId,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  })
  res.status(201).json(assignment)
}
