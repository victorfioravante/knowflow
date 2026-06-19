import { AssignmentTargetType, Deck, DeckStatus, User, UserRole } from '@prisma/client'
import { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { createDeckFromTemplate } from '../services/template.service'

export const createDeckSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(500).nullable().optional(),
  coverColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  sectorId: z.string().cuid().nullable().optional(),
  knowledgeAreaId: z.string().cuid().nullable().optional(),
})

export const updateDeckSchema = createDeckSchema.partial()

export const fromTemplateSchema = z.object({
  title: z.string().min(1).max(160).optional(),
})

export const rejectDeckSchema = z.object({
  note: z.string().min(1).max(500),
})

const deckListInclude = {
  knowledgeArea: { select: { id: true, name: true, color: true } },
  sector: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true, avatarUrl: true } },
  _count: { select: { stories: true } },
} as const

/** Decks só podem ter conteúdo editado em DRAFT ou REJECTED, pelo criador ou ADMIN/MANAGER. */
export function canEditDeck(user: User, deck: Deck): { ok: boolean; error?: string } {
  const isOwner = deck.createdById === user.id
  const isManager = user.role === UserRole.ADMIN || user.role === UserRole.MANAGER
  if (!isOwner && !isManager) return { ok: false, error: 'Permissão insuficiente' }
  if (deck.status !== DeckStatus.DRAFT && deck.status !== DeckStatus.REJECTED) {
    return { ok: false, error: 'Deck não pode ser editado neste status' }
  }
  return { ok: true }
}

export async function findOrgDeck(deckId: string, organizationId: string) {
  return prisma.deck.findFirst({ where: { id: deckId, organizationId } })
}

// GET /api/decks — lista decks (filtros: status, area, sector)
export async function listDecks(req: Request, res: Response) {
  const { status, knowledgeAreaId, sectorId } = req.query
  const isLearner = req.user.role === UserRole.LEARNER

  const decks = await prisma.deck.findMany({
    where: {
      organizationId: req.organization.id,
      // Learners só veem conteúdo aprovado
      status: isLearner
        ? DeckStatus.APPROVED
        : status
          ? (status as DeckStatus)
          : undefined,
      knowledgeAreaId: knowledgeAreaId ? String(knowledgeAreaId) : undefined,
      sectorId: sectorId ? String(sectorId) : undefined,
    },
    orderBy: { updatedAt: 'desc' },
    include: deckListInclude,
  })
  res.json(decks)
}

// GET /api/decks/my — decks criados pelo usuário
export async function listMyDecks(req: Request, res: Response) {
  const decks = await prisma.deck.findMany({
    where: { organizationId: req.organization.id, createdById: req.user.id },
    orderBy: { updatedAt: 'desc' },
    include: deckListInclude,
  })
  res.json(decks)
}

// GET /api/decks/:id
export async function getDeck(req: Request, res: Response) {
  const deck = await prisma.deck.findFirst({
    where: { id: req.params.id, organizationId: req.organization.id },
    include: {
      ...deckListInclude,
      stories: {
        orderBy: { order: 'asc' },
        include: { blocks: { orderBy: { order: 'asc' } } },
      },
    },
  })
  if (!deck) return res.status(404).json({ error: 'Deck não encontrado' })

  // Learners só acessam decks aprovados
  if (req.user.role === UserRole.LEARNER && deck.status !== DeckStatus.APPROVED) {
    return res.status(403).json({ error: 'Permissão insuficiente' })
  }
  res.json(deck)
}

// POST /api/decks — cria deck (CONTRIBUTOR+)
export async function createDeck(req: Request, res: Response) {
  const data = req.body as z.infer<typeof createDeckSchema>
  const organizationId = req.organization.id

  if (data.sectorId) {
    const sector = await prisma.sector.findFirst({
      where: { id: data.sectorId, organizationId },
    })
    if (!sector) return res.status(400).json({ error: 'Setor inválido' })
  }
  if (data.knowledgeAreaId) {
    const area = await prisma.knowledgeArea.findFirst({
      where: { id: data.knowledgeAreaId, organizationId },
    })
    if (!area) return res.status(400).json({ error: 'Área inválida' })
  }

  const deck = await prisma.deck.create({
    data: {
      ...data,
      organizationId,
      createdById: req.user.id,
      // Todo deck nasce com uma story vazia
      stories: { create: [{ order: 0 }] },
    },
    include: {
      ...deckListInclude,
      stories: { orderBy: { order: 'asc' }, include: { blocks: true } },
    },
  })
  res.status(201).json(deck)
}

// POST /api/decks/from-template/:templateId
export async function createFromTemplate(req: Request, res: Response) {
  const { title } = req.body as z.infer<typeof fromTemplateSchema>
  try {
    const deck = await createDeckFromTemplate({
      templateId: req.params.templateId,
      organizationId: req.organization.id,
      userId: req.user.id,
      title,
    })
    res.status(201).json(deck)
  } catch (err) {
    if (err instanceof Error && err.message === 'TEMPLATE_NOT_FOUND') {
      return res.status(404).json({ error: 'Template não encontrado' })
    }
    throw err
  }
}

// PATCH /api/decks/:id
export async function updateDeck(req: Request, res: Response) {
  const data = req.body as z.infer<typeof updateDeckSchema>
  const deck = await findOrgDeck(req.params.id, req.organization.id)
  if (!deck) return res.status(404).json({ error: 'Deck não encontrado' })

  const permission = canEditDeck(req.user, deck)
  if (!permission.ok) return res.status(403).json({ error: permission.error })

  const updated = await prisma.deck.update({
    where: { id: deck.id },
    data,
    include: deckListInclude,
  })
  res.json(updated)
}

// DELETE /api/decks/:id
export async function deleteDeck(req: Request, res: Response) {
  const deck = await findOrgDeck(req.params.id, req.organization.id)
  if (!deck) return res.status(404).json({ error: 'Deck não encontrado' })

  const isOwner = deck.createdById === req.user.id
  if (!isOwner && req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Permissão insuficiente' })
  }

  await prisma.deck.delete({ where: { id: deck.id } })
  res.status(204).end()
}

// POST /api/decks/:id/submit — submete para aprovação (DRAFT/REJECTED → PENDING)
export async function submitDeck(req: Request, res: Response) {
  const deck = await findOrgDeck(req.params.id, req.organization.id)
  if (!deck) return res.status(404).json({ error: 'Deck não encontrado' })

  const permission = canEditDeck(req.user, deck)
  if (!permission.ok) return res.status(403).json({ error: permission.error })

  // Deck precisa ter ao menos um bloco de conteúdo
  const blockCount = await prisma.block.count({ where: { story: { deckId: deck.id } } })
  if (blockCount === 0) {
    return res.status(400).json({ error: 'Adicione conteúdo antes de enviar para aprovação' })
  }

  const updated = await prisma.deck.update({
    where: { id: deck.id },
    data: { status: DeckStatus.PENDING, rejectionNote: null },
    include: deckListInclude,
  })
  res.json(updated)
}

// POST /api/decks/:id/approve — aprova deck (MANAGER|ADMIN)
export async function approveDeck(req: Request, res: Response) {
  const deck = await findOrgDeck(req.params.id, req.organization.id)
  if (!deck) return res.status(404).json({ error: 'Deck não encontrado' })
  if (deck.status !== DeckStatus.PENDING) {
    return res.status(400).json({ error: 'Apenas decks pendentes podem ser aprovados' })
  }

  const updated = await prisma.deck.update({
    where: { id: deck.id },
    data: { status: DeckStatus.APPROVED, approvedById: req.user.id, rejectionNote: null },
    include: deckListInclude,
  })
  res.json(updated)
}

// POST /api/decks/:id/reject — rejeita deck com nota (MANAGER|ADMIN)
export async function rejectDeck(req: Request, res: Response) {
  const { note } = req.body as z.infer<typeof rejectDeckSchema>
  const deck = await findOrgDeck(req.params.id, req.organization.id)
  if (!deck) return res.status(404).json({ error: 'Deck não encontrado' })
  if (deck.status !== DeckStatus.PENDING) {
    return res.status(400).json({ error: 'Apenas decks pendentes podem ser rejeitados' })
  }

  const updated = await prisma.deck.update({
    where: { id: deck.id },
    data: { status: DeckStatus.REJECTED, rejectionNote: note },
    include: deckListInclude,
  })
  res.json(updated)
}

// POST /api/decks/:id/redraft — reabre deck aprovado para edição (owner ou ADMIN/MANAGER)
export async function reDraftDeck(req: Request, res: Response) {
  const deck = await findOrgDeck(req.params.id, req.organization.id)
  if (!deck) return res.status(404).json({ error: 'Deck não encontrado' })

  const isOwner = deck.createdById === req.user.id
  const isManager = req.user.role === UserRole.ADMIN || req.user.role === UserRole.MANAGER
  if (!isOwner && !isManager) return res.status(403).json({ error: 'Permissão insuficiente' })

  if (deck.status !== DeckStatus.APPROVED) {
    return res.status(400).json({ error: 'Apenas decks aprovados podem ser reabertos' })
  }

  const updated = await prisma.deck.update({
    where: { id: deck.id },
    data: { status: DeckStatus.DRAFT, approvedById: null },
    include: deckListInclude,
  })
  res.json(updated)
}

// GET /api/decks/assigned — decks aprovados visíveis ao usuário, com progresso
export async function listAssignedDecks(req: Request, res: Response) {
  const userId = req.user.id
  const organizationId = req.organization.id
  const sectorId = req.user.sectorId

  // Verifica se existem assignments explícitos para este usuário/setor/org
  const assignmentCount = await prisma.assignment.count({
    where: {
      deckId: { not: null },
      OR: [
        { targetType: AssignmentTargetType.USER, targetId: userId },
        ...(sectorId ? [{ targetType: AssignmentTargetType.SECTOR, targetId: sectorId }] : []),
        { targetType: AssignmentTargetType.ORGANIZATION, targetId: organizationId },
      ],
    },
  })

  let decksList
  if (assignmentCount === 0) {
    // Sem assignments: mostra todos os decks aprovados da org (comportamento padrão demo)
    decksList = await prisma.deck.findMany({
      where: { organizationId, status: DeckStatus.APPROVED },
      orderBy: { updatedAt: 'desc' },
      include: deckListInclude,
    })
  } else {
    const assignments = await prisma.assignment.findMany({
      where: {
        deckId: { not: null },
        deck: { is: { organizationId, status: DeckStatus.APPROVED } },
        OR: [
          { targetType: AssignmentTargetType.USER, targetId: userId },
          ...(sectorId ? [{ targetType: AssignmentTargetType.SECTOR, targetId: sectorId }] : []),
          { targetType: AssignmentTargetType.ORGANIZATION, targetId: organizationId },
        ],
      },
      include: { deck: { include: deckListInclude } },
    })
    const seen = new Set<string>()
    decksList = assignments
      .map((a) => a.deck)
      .filter((d): d is NonNullable<typeof d> => {
        if (!d || seen.has(d.id)) return false
        seen.add(d.id)
        return true
      })
  }

  const deckIds = decksList.map((d) => d.id)
  const progresses = await prisma.deckProgress.findMany({
    where: { userId, deckId: { in: deckIds } },
  })
  const progressMap = new Map(progresses.map((p) => [p.deckId, p]))

  res.json(decksList.map((d) => ({ ...d, progress: progressMap.get(d.id) ?? null })))
}
