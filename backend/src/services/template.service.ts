// Geração de deck a partir de template
import { BlockType, Deck } from '@prisma/client'
import { prisma } from '../lib/prisma'

interface TemplateBlock {
  type: BlockType
  order: number
  data: Record<string, unknown>
}

interface TemplateStory {
  order: number
  blocks: TemplateBlock[]
}

export async function createDeckFromTemplate(params: {
  templateId: string
  organizationId: string
  userId: string
  title?: string
}): Promise<Deck> {
  const { templateId, organizationId, userId, title } = params

  // Template da plataforma (organizationId null) ou da própria org
  const template = await prisma.template.findFirst({
    where: {
      id: templateId,
      OR: [{ organizationId: null }, { organizationId }],
    },
  })
  if (!template) throw new Error('TEMPLATE_NOT_FOUND')

  const structure = template.structure as unknown as TemplateStory[]

  return prisma.deck.create({
    data: {
      title: title ?? template.name,
      organizationId,
      createdById: userId,
      fromTemplateId: template.id,
      stories: {
        create: structure.map((story) => ({
          order: story.order,
          blocks: {
            create: story.blocks.map((block) => ({
              type: block.type,
              order: block.order,
              data: block.data as object,
            })),
          },
        })),
      },
    },
    include: { stories: { orderBy: { order: 'asc' }, include: { blocks: true } } },
  })
}
