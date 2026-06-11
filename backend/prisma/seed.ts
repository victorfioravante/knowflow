// prisma/seed.ts — Templates da plataforma + organização demo
import { PrismaClient, TemplateSource } from '@prisma/client'

const prisma = new PrismaClient()

const platformTemplates = [
  {
    name: 'Conceito + Imagem',
    description:
      'Para apresentar um conceito com apoio visual. Ideal para definições, normas e regras.',
    source: TemplateSource.PLATFORM,
    structure: [
      {
        order: 0,
        blocks: [
          {
            type: 'TEXT',
            order: 0,
            data: {
              content: 'Ex: "EPI obrigatório para trabalho em alta tensão"',
              isExample: true,
            },
          },
          {
            type: 'IMAGE',
            order: 1,
            data: {
              url: null,
              alt: 'foto do equipamento ou situação',
              isExample: true,
            },
          },
          {
            type: 'FLASHCARD',
            order: 2,
            data: {
              front: 'Ex: sigla ou termo técnico',
              back: 'Ex: o que significa',
              isExample: true,
            },
          },
        ],
      },
    ],
  },
  {
    name: 'Procedimento Passo a Passo',
    description:
      'Para documentar processos em etapas. Inclui voz para o especialista explicar.',
    source: TemplateSource.PLATFORM,
    structure: [
      {
        order: 0,
        blocks: [
          {
            type: 'TEXT',
            order: 0,
            data: {
              content: 'Ex: "Como realizar a inspeção antes de ligar o equipamento"',
              isExample: true,
            },
          },
          {
            type: 'VOICE',
            order: 1,
            data: {
              audioUrl: null,
              duration: 0,
              transcript: 'Grave sua explicação do procedimento (até 2 min)',
              isExample: true,
            },
          },
          {
            type: 'QUIZ',
            order: 2,
            data: {
              question: 'Ex: "Qual é o primeiro passo antes de ligar o equipamento?"',
              options: ['Opção A', 'Opção B', 'Opção C', 'Opção D'],
              correctIndex: 0,
              explanation: 'Ex: explicação da resposta correta',
              isExample: true,
            },
          },
        ],
      },
    ],
  },
  {
    name: 'Voz + Imagem de Campo',
    description:
      'Para técnicos que fotografam o equipamento e gravam a explicação. Criação em menos de 2 minutos.',
    source: TemplateSource.PLATFORM,
    structure: [
      {
        order: 0,
        blocks: [
          {
            type: 'IMAGE',
            order: 0,
            data: { url: null, alt: 'foto tirada no campo', isExample: true },
          },
          {
            type: 'VOICE',
            order: 1,
            data: { audioUrl: null, duration: 0, isExample: true },
          },
          {
            type: 'TEXT',
            order: 2,
            data: {
              content: 'Ex: resumo em uma linha do que foi explicado',
              isExample: true,
            },
          },
        ],
      },
    ],
  },
  {
    name: 'Mini Avaliação',
    description:
      'Para checar o entendimento com 3 a 5 perguntas. Ideal para o final de um onboarding.',
    source: TemplateSource.PLATFORM,
    structure: [
      {
        order: 0,
        blocks: [
          {
            type: 'TEXT',
            order: 0,
            data: {
              content: 'Ex: "Vamos ver o que você aprendeu sobre segurança elétrica"',
              isExample: true,
            },
          },
        ],
      },
      {
        order: 1,
        blocks: [
          {
            type: 'QUIZ',
            order: 0,
            data: {
              question: 'Ex: pergunta 1',
              options: ['A', 'B', 'C', 'D'],
              correctIndex: 0,
              isExample: true,
            },
          },
        ],
      },
      {
        order: 2,
        blocks: [
          {
            type: 'QUIZ',
            order: 0,
            data: {
              question: 'Ex: pergunta 2',
              options: ['A', 'B', 'C', 'D'],
              correctIndex: 1,
              isExample: true,
            },
          },
        ],
      },
    ],
  },
]

async function main() {
  // Templates fixos da plataforma (idempotente: recria a partir do nome)
  for (const template of platformTemplates) {
    const existing = await prisma.template.findFirst({
      where: { name: template.name, source: TemplateSource.PLATFORM },
    })
    if (!existing) {
      await prisma.template.create({ data: template })
      console.log(`Template criado: ${template.name}`)
    }
  }

  // Organização demo para desenvolvimento
  const demoOrg = await prisma.organization.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Organização Demo',
      slug: 'demo',
      sectors: {
        create: [{ name: 'Operações' }, { name: 'Comercial' }, { name: 'RH' }],
      },
      roles: {
        create: [{ name: 'Técnico' }, { name: 'Analista' }, { name: 'Gestor' }],
      },
      knowledgeAreas: {
        create: [
          { name: 'Segurança', color: '#D85A30' },
          { name: 'Processos', color: '#1D9E75' },
          { name: 'Produto', color: '#3B82F6' },
        ],
      },
    },
  })
  console.log(`Organização demo: ${demoOrg.slug} (${demoOrg.id})`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
