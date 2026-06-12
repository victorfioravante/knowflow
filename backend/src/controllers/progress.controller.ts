import { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

const quizScoreSchema = z.object({
  score: z.number().min(0).max(100),
})

// POST /api/progress/deck/:deckId/complete
export async function completeDeck(req: Request, res: Response) {
  const deck = await prisma.deck.findFirst({
    where: { id: req.params.deckId, organizationId: req.organization.id },
  })
  if (!deck) return res.status(404).json({ error: 'Deck não encontrado' })

  const progress = await prisma.deckProgress.upsert({
    where: { userId_deckId: { userId: req.user.id, deckId: deck.id } },
    create: { userId: req.user.id, deckId: deck.id, completedAt: new Date() },
    update: { completedAt: new Date() },
  })
  res.json(progress)
}

// POST /api/progress/deck/:deckId/quiz-score
export async function saveDeckQuizScore(req: Request, res: Response) {
  const parsed = quizScoreSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const deck = await prisma.deck.findFirst({
    where: { id: req.params.deckId, organizationId: req.organization.id },
  })
  if (!deck) return res.status(404).json({ error: 'Deck não encontrado' })

  const progress = await prisma.deckProgress.upsert({
    where: { userId_deckId: { userId: req.user.id, deckId: deck.id } },
    create: { userId: req.user.id, deckId: deck.id, score: parsed.data.score },
    update: { score: parsed.data.score },
  })
  res.json(progress)
}
