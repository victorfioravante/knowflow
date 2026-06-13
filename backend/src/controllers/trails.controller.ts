import { Request, Response } from 'express'
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
