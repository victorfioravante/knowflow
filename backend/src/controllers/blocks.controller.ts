import { BlockType } from '@prisma/client'
import { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { canEditDeck } from './decks.controller'

// Schemas permissivos para rascunho — completude é validada na submissão
const textData = z.object({ content: z.any() }).passthrough()
const imageData = z
  .object({ url: z.string().url().nullable(), alt: z.string().max(200).optional() })
  .passthrough()
const voiceData = z
  .object({
    audioUrl: z.string().url().nullable(),
    duration: z.number().min(0).max(120).default(0),
    transcript: z.string().max(2000).optional(),
  })
  .passthrough()
const flashcardData = z
  .object({
    front: z.string().max(500).default(''),
    back: z.string().max(1000).default(''),
    frontImageUrl: z.string().url().nullable().optional(),
  })
  .passthrough()
const quizData = z
  .object({
    question: z.string().max(500).default(''),
    options: z.array(z.string().max(200)).min(2).max(6),
    correctIndex: z.number().int().min(0),
    explanation: z.string().max(1000).optional(),
  })
  .passthrough()
  .refine((d) => d.correctIndex < d.options.length, {
    message: 'correctIndex fora do intervalo de opções',
  })

export const DATA_SCHEMA_BY_TYPE: Record<BlockType, z.ZodTypeAny> = {
  TEXT: textData,
  IMAGE: imageData,
  VOICE: voiceData,
  FLASHCARD: flashcardData,
  QUIZ: quizData,
}

/**
 * Valida e normaliza os dados de um bloco conforme seu tipo (lógica pura, sem Express).
 * Remove o marcador `isExample` deixado por templates quando o bloco é editado.
 */
export function parseBlockData(
  type: BlockType,
  data: unknown,
): { ok: true; data: Record<string, unknown> } | { ok: false; error: z.ZodError } {
  const result = DATA_SCHEMA_BY_TYPE[type].safeParse(data)
  if (!result.success) return { ok: false, error: result.error }
  const parsed = result.data as Record<string, unknown>
  delete parsed.isExample
  return { ok: true, data: parsed }
}

/** Dados iniciais de um bloco recém-criado pela toolbar. */
const EMPTY_DATA_BY_TYPE: Record<BlockType, object> = {
  TEXT: { content: null },
  IMAGE: { url: null, alt: '' },
  VOICE: { audioUrl: null, duration: 0 },
  FLASHCARD: { front: '', back: '' },
  QUIZ: { question: '', options: ['', '', '', ''], correctIndex: 0 },
}

export const createBlockSchema = z.object({
  type: z.nativeEnum(BlockType),
  data: z.record(z.unknown()).optional(),
})

export const updateBlockSchema = z.object({
  data: z.record(z.unknown()),
})

export const reorderBlocksSchema = z.object({
  blockIds: z.array(z.string().cuid()).min(1),
})

/** Carrega a story (com deck) garantindo org + permissão de edição. */
async function loadEditableStory(req: Request, res: Response) {
  const story = await prisma.story.findFirst({
    where: {
      id: req.params.storyId,
      deck: { organizationId: req.organization.id },
    },
    include: { deck: true },
  })
  if (!story) {
    res.status(404).json({ error: 'Story não encontrada' })
    return null
  }
  const permission = canEditDeck(req.user, story.deck)
  if (!permission.ok) {
    res.status(403).json({ error: permission.error })
    return null
  }
  return story
}

function validateBlockData(type: BlockType, data: unknown, res: Response) {
  const result = parseBlockData(type, data)
  if (!result.ok) {
    res.status(400).json({
      error: 'Dados do bloco inválidos',
      details: result.error.flatten(),
    })
    return null
  }
  return result.data
}

// GET /api/stories/:storyId/blocks
export async function listBlocks(req: Request, res: Response) {
  const story = await prisma.story.findFirst({
    where: {
      id: req.params.storyId,
      deck: { organizationId: req.organization.id },
    },
  })
  if (!story) return res.status(404).json({ error: 'Story não encontrada' })

  const blocks = await prisma.block.findMany({
    where: { storyId: story.id },
    orderBy: { order: 'asc' },
  })
  res.json(blocks)
}

// POST /api/stories/:storyId/blocks
export async function createBlock(req: Request, res: Response) {
  const story = await loadEditableStory(req, res)
  if (!story) return

  const { type, data } = req.body as z.infer<typeof createBlockSchema>
  let blockData: object = EMPTY_DATA_BY_TYPE[type]
  if (data) {
    const validated = validateBlockData(type, data, res)
    if (!validated) return
    blockData = validated
  }

  const last = await prisma.block.findFirst({
    where: { storyId: story.id },
    orderBy: { order: 'desc' },
  })
  const block = await prisma.block.create({
    data: {
      storyId: story.id,
      type,
      order: (last?.order ?? -1) + 1,
      data: blockData,
    },
  })
  res.status(201).json(block)
}

// PATCH /api/stories/:storyId/blocks/reorder
export async function reorderBlocks(req: Request, res: Response) {
  const story = await loadEditableStory(req, res)
  if (!story) return

  const { blockIds } = req.body as z.infer<typeof reorderBlocksSchema>
  const count = await prisma.block.count({
    where: { storyId: story.id, id: { in: blockIds } },
  })
  if (count !== blockIds.length) {
    return res.status(400).json({ error: 'Blocos inválidos para esta story' })
  }

  await prisma.$transaction(
    blockIds.map((id, index) =>
      prisma.block.update({ where: { id }, data: { order: index } }),
    ),
  )
  res.json({ reordered: true })
}

// PATCH /api/stories/:storyId/blocks/:id
export async function updateBlock(req: Request, res: Response) {
  const story = await loadEditableStory(req, res)
  if (!story) return

  const block = await prisma.block.findFirst({
    where: { id: req.params.id, storyId: story.id },
  })
  if (!block) return res.status(404).json({ error: 'Bloco não encontrado' })

  const { data } = req.body as z.infer<typeof updateBlockSchema>
  const validated = validateBlockData(block.type, data, res)
  if (!validated) return

  const updated = await prisma.block.update({
    where: { id: block.id },
    data: { data: validated as object },
  })
  res.json(updated)
}

// DELETE /api/stories/:storyId/blocks/:id
export async function deleteBlock(req: Request, res: Response) {
  const story = await loadEditableStory(req, res)
  if (!story) return

  const block = await prisma.block.findFirst({
    where: { id: req.params.id, storyId: story.id },
  })
  if (!block) return res.status(404).json({ error: 'Bloco não encontrado' })

  await prisma.block.delete({ where: { id: block.id } })
  res.status(204).end()
}
