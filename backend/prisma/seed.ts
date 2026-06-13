// prisma/seed.ts — Templates da plataforma + organização demo + conteúdo demo
import { BlockType, DeckStatus, PrismaClient, TemplateSource, UserRole } from '@prisma/client'

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

  await ensureDemoUser(demoOrg.id)
  await seedDemoDecks(demoOrg.id)
}

/**
 * Provisiona o usuário de demonstração caso DEMO_USER_SUPABASE_ID esteja definido.
 * O ID é o que o Supabase atribui à conta demo (ex.: demo@knowflow.app) — assim a
 * demo pública fica navegável sem depender de um login prévio para popular o banco.
 * É ADMIN para que o tour mostre criação, aprovação e consumo de conteúdo.
 */
async function ensureDemoUser(organizationId: string) {
  const supabaseId = process.env.DEMO_USER_SUPABASE_ID
  if (!supabaseId) {
    console.log('DEMO_USER_SUPABASE_ID não definido — usuário demo não provisionado')
    return
  }

  const email = process.env.DEMO_USER_EMAIL ?? 'demo@knowflow.app'
  await prisma.user.upsert({
    where: { supabaseId },
    update: { organizationId },
    create: {
      supabaseId,
      email,
      name: 'Visitante Demo',
      role: UserRole.ADMIN,
      organizationId,
    },
  })
  console.log(`Usuário demo provisionado: ${email}`)
}

// ─── Decks demo (conteúdo aprovado para visualização) ──────

interface DemoBlock {
  type: BlockType
  data: object
}

interface DemoDeck {
  title: string
  description: string
  coverColor: string
  knowledgeArea: string
  stories: DemoBlock[][]
}

const demoDecks: DemoDeck[] = [
  {
    title: 'NR-10: Segurança em Eletricidade',
    description: 'O essencial da norma para quem trabalha perto de instalações elétricas.',
    coverColor: '#D85A30',
    knowledgeArea: 'Segurança',
    stories: [
      [
        {
          type: BlockType.TEXT,
          data: {
            content:
              '<h2>Por que a NR-10 existe?</h2><p>Acidentes com eletricidade estão entre os mais letais da indústria. A NR-10 define as condições mínimas para garantir a segurança de quem interage com instalações elétricas.</p><p><strong>Regra de ouro:</strong> nenhum serviço em rede energizada sem autorização e EPI adequado.</p>',
          },
        },
        {
          type: BlockType.IMAGE,
          data: {
            url: 'https://picsum.photos/seed/knowflow-eletrica/800/1000',
            alt: 'Instalação elétrica industrial',
          },
        },
      ],
      [
        {
          type: BlockType.TEXT,
          data: {
            content: '<h3>Termos que você precisa dominar</h3><p>Toque nos cards para revelar o significado.</p>',
          },
        },
        {
          type: BlockType.FLASHCARD,
          data: { front: 'O que significa SEP?', back: 'Sistema Elétrico de Potência — geração, transmissão e distribuição em alta tensão.' },
        },
        {
          type: BlockType.FLASHCARD,
          data: { front: 'Qual é a tensão limite para "baixa tensão"?', back: 'Até 1.000V em corrente alternada ou 1.500V em corrente contínua.' },
        },
      ],
      [
        {
          type: BlockType.QUIZ,
          data: {
            question: 'Antes de iniciar qualquer serviço em uma instalação elétrica, o primeiro passo é:',
            options: [
              'Desenergizar e bloquear a fonte (lockout/tagout)',
              'Colocar luvas de borracha',
              'Avisar o supervisor por mensagem',
              'Testar o circuito com o equipamento ligado',
            ],
            correctIndex: 0,
            explanation: 'A desenergização com bloqueio e etiquetagem é a medida de controle prioritária prevista na NR-10.',
          },
        },
      ],
    ],
  },
  {
    title: 'Onboarding: Como Trabalhamos',
    description: 'Os processos e rituais do time para quem está chegando agora.',
    coverColor: '#1D9E75',
    knowledgeArea: 'Processos',
    stories: [
      [
        {
          type: BlockType.TEXT,
          data: {
            content:
              '<h2>Bem-vindo(a) ao time! 👋</h2><p>Este deck resume como organizamos o trabalho no dia a dia:</p><ul><li><strong>Daily</strong> às 9h15 — 15 minutos, sem exceção</li><li><strong>Sexta</strong> é dia de retro e demo</li><li>Decisões importantes viram <strong>registro escrito</strong>, nunca só conversa</li></ul>',
          },
        },
        {
          type: BlockType.IMAGE,
          data: {
            url: 'https://picsum.photos/seed/knowflow-time/800/1000',
            alt: 'Time em reunião',
          },
        },
      ],
      [
        {
          type: BlockType.FLASHCARD,
          data: { front: 'Onde registramos decisões importantes?', back: 'No canal #decisoes, sempre com contexto, alternativas avaliadas e responsável.' },
        },
        {
          type: BlockType.QUIZ,
          data: {
            question: 'Você identificou um problema urgente em produção. O que fazer primeiro?',
            options: [
              'Abrir um incidente no canal #ops e avisar o plantonista',
              'Tentar corrigir sozinho sem avisar ninguém',
              'Esperar a daily do dia seguinte',
              'Mandar mensagem privada para o gestor',
            ],
            correctIndex: 0,
            explanation: 'Incidentes seguem o fluxo do canal #ops — visibilidade primeiro, correção em seguida.',
          },
        },
      ],
    ],
  },
  {
    title: 'Conhecendo Nosso Produto',
    description: 'O que vendemos, para quem e por quê — explicado pelo time.',
    coverColor: '#3B82F6',
    knowledgeArea: 'Produto',
    stories: [
      [
        {
          type: BlockType.IMAGE,
          data: {
            url: 'https://picsum.photos/seed/knowflow-produto/800/1000',
            alt: 'Produto em uso no campo',
          },
        },
        {
          type: BlockType.VOICE,
          data: {
            audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
            duration: 372,
            transcript:
              'Áudio de demonstração — no uso real, o especialista grava a explicação direto pelo app (até 2 minutos).',
          },
        },
        {
          type: BlockType.TEXT,
          data: {
            content: '<p><strong>Resumo:</strong> nosso produto resolve o problema de conhecimento preso na cabeça de poucas pessoas — transformando-o em conteúdo que o time inteiro aprende.</p>',
          },
        },
      ],
      [
        {
          type: BlockType.QUIZ,
          data: {
            question: 'Qual é o principal diferencial do nosso produto?',
            options: [
              'Conhecimento criado pelos próprios colaboradores, no formato stories',
              'Ser o LMS mais barato do mercado',
              'Cursos prontos comprados de terceiros',
              'Substituir o RH da empresa',
            ],
            correctIndex: 0,
            explanation: 'Não somos um LMS: somos o lugar onde o conhecimento interno vira aprendizado para todo o time.',
          },
        },
      ],
    ],
  },
]

async function seedDemoDecks(organizationId: string) {
  // Usa o primeiro usuário da org demo como criador/aprovador
  const user = await prisma.user.findFirst({
    where: { organizationId },
    orderBy: { createdAt: 'asc' },
  })
  if (!user) {
    console.log('Nenhum usuário na org demo — decks demo não criados (crie seu usuário e rode o seed novamente)')
    return
  }

  const areas = await prisma.knowledgeArea.findMany({ where: { organizationId } })
  const areaByName = new Map(areas.map((a) => [a.name, a.id]))

  for (const demo of demoDecks) {
    const existing = await prisma.deck.findFirst({
      where: { title: demo.title, organizationId },
    })
    if (existing) continue

    await prisma.deck.create({
      data: {
        title: demo.title,
        description: demo.description,
        coverColor: demo.coverColor,
        status: DeckStatus.APPROVED,
        organizationId,
        knowledgeAreaId: areaByName.get(demo.knowledgeArea) ?? null,
        createdById: user.id,
        approvedById: user.id,
        stories: {
          create: demo.stories.map((blocks, storyIndex) => ({
            order: storyIndex,
            blocks: {
              create: blocks.map((block, blockIndex) => ({
                type: block.type,
                order: blockIndex,
                data: block.data,
              })),
            },
          })),
        },
      },
    })
    console.log(`Deck demo criado: ${demo.title}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
