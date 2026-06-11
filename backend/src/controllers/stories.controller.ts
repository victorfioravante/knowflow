import { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { canEditDeck, findOrgDeck } from './decks.controller'

export const reorderStoriesSchema = z.object({
  storyIds: z.array(z.string().cuid()).min(1),
})

/** Carrega o deck da org e valida permissão de edição. */
async function loadEditableDeck(req: Request, res: Response) {
  const deck = await findOrgDeck(req.params.deckId, req.organization.id)
  if (!deck) {
    res.status(404).json({ error: 'Deck não encontrado' })
    return null
  }
  const permission = canEditDeck(req.user, deck)
  if (!permission.ok) {
    res.status(403).json({ error: permission.error })
    return null
  }
  return deck
}

// GET /api/decks/:deckId/stories — lista stories do deck (ordenadas)
export async function listStories(req: Request, res: Response) {
  const deck = await findOrgDeck(req.params.deckId, req.organization.id)
  if (!deck) return res.status(404).json({ error: 'Deck não encontrado' })

  const stories = await prisma.story.findMany({
    where: { deckId: deck.id },
    orderBy: { order: 'asc' },
    include: { blocks: { orderBy: { order: 'asc' } } },
  })
  res.json(stories)
}

// POST /api/decks/:deckId/stories — cria story
export async function createStory(req: Request, res: Response) {
  const deck = await loadEditableDeck(req, res)
  if (!deck) return

  const last = await prisma.story.findFirst({
    where: { deckId: deck.id },
    orderBy: { order: 'desc' },
  })
  const story = await prisma.story.create({
    data: { deckId: deck.id, order: (last?.order ?? -1) + 1 },
    include: { blocks: true },
  })
  res.status(201).json(story)
}

// PATCH /api/decks/:deckId/stories/reorder — reordena array de stories
export async function reorderStories(req: Request, res: Response) {
  const deck = await loadEditableDeck(req, res)
  if (!deck) return

  const { storyIds } = req.body as z.infer<typeof reorderStoriesSchema>
  const count = await prisma.story.count({
    where: { deckId: deck.id, id: { in: storyIds } },
  })
  if (count !== storyIds.length) {
    return res.status(400).json({ error: 'Stories inválidas para este deck' })
  }

  await prisma.$transaction(
    storyIds.map((id, index) =>
      prisma.story.update({ where: { id }, data: { order: index } }),
    ),
  )
  res.json({ reordered: true })
}

// PATCH /api/decks/:deckId/stories/:id
export async function updateStory(req: Request, res: Response) {
  const deck = await loadEditableDeck(req, res)
  if (!deck) return

  const story = await prisma.story.findFirst({
    where: { id: req.params.id, deckId: deck.id },
  })
  if (!story) return res.status(404).json({ error: 'Story não encontrada' })

  // Story só carrega `order`; toque para atualizar updatedAt
  const updated = await prisma.story.update({
    where: { id: story.id },
    data: {},
    include: { blocks: { orderBy: { order: 'asc' } } },
  })
  res.json(updated)
}

// DELETE /api/decks/:deckId/stories/:id
export async function deleteStory(req: Request, res: Response) {
  const deck = await loadEditableDeck(req, res)
  if (!deck) return

  const story = await prisma.story.findFirst({
    where: { id: req.params.id, deckId: deck.id },
  })
  if (!story) return res.status(404).json({ error: 'Story não encontrada' })

  const storyCount = await prisma.story.count({ where: { deckId: deck.id } })
  if (storyCount <= 1) {
    return res.status(409).json({ error: 'O deck precisa de pelo menos uma story' })
  }

  await prisma.story.delete({ where: { id: story.id } })
  res.status(204).end()
}
