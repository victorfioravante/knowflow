import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Play } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { listAssignedDecks } from '@/services/decks'
import type { Deck, DeckProgress } from '@/types'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export default function HomePage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const { data: decks = [], isLoading } = useQuery({
    queryKey: ['assigned-decks'],
    queryFn: listAssignedDecks,
  })

  const completed = decks.filter((d) => d.progress?.completedAt)
  const pending = decks.filter((d) => !d.progress?.completedAt)

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <div className="min-h-full bg-surface pb-24">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400">{user?.organization?.name}</p>
            <h1 className="mt-0.5 text-2xl font-bold text-gray-900">
              Olá, {user?.name?.split(' ')[0]} 👋
            </h1>
          </div>
          <button
            onClick={signOut}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white"
            title="Sair"
          >
            {initials}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 px-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-card bg-gray-100" />
          ))}
        </div>
      ) : decks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-4xl mb-3">📚</p>
          <p className="font-semibold text-gray-700">Nenhum conteúdo disponível</p>
          <p className="text-sm text-gray-400 mt-1">Aguarde seu gestor publicar conteúdo.</p>
        </div>
      ) : (
        <div className="space-y-6 px-5">
          {pending.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                  Para você
                </h2>
                <span className="text-xs text-gray-400">{pending.length} pendentes</span>
              </div>
              <motion.div className="space-y-3" variants={container} initial="hidden" animate="show">
                {pending.map((deck) => (
                  <motion.div key={deck.id} variants={item}>
                    <DeckFeedCard
                      deck={deck}
                      progress={deck.progress ?? null}
                      onClick={() => navigate(`/decks/${deck.id}/play`)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </section>
          )}

          {completed.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                  Concluídos
                </h2>
              </div>
              <motion.div className="space-y-3" variants={container} initial="hidden" animate="show">
                {completed.map((deck) => (
                  <motion.div key={deck.id} variants={item}>
                    <DeckFeedCard
                      deck={deck}
                      progress={deck.progress ?? null}
                      onClick={() => navigate(`/decks/${deck.id}/play`)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function DeckFeedCard({
  deck,
  progress,
  onClick,
}: {
  deck: Deck
  progress: DeckProgress | null
  onClick: () => void
}) {
  const isCompleted = !!progress?.completedAt
  const storyCount = deck._count?.stories ?? deck.stories?.length ?? 0

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-card bg-surface-card p-4 text-left shadow-card transition-all active:scale-[0.98] hover:shadow-md"
    >
      {/* Ícone colorido */}
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: deck.coverColor ?? '#D85A30' }}
      >
        <BookStackIcon className="h-6 w-6 text-white/90" />
      </div>

      {/* Conteúdo */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-gray-900">{deck.title}</p>
        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
          {deck.knowledgeArea && (
            <span
              className="inline-block rounded-pill px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
              style={{ backgroundColor: deck.knowledgeArea.color }}
            >
              {deck.knowledgeArea.name}
            </span>
          )}
          <span className="text-xs text-gray-400">
            {storyCount} {storyCount === 1 ? 'story' : 'stories'}
          </span>
        </div>
        {isCompleted && progress?.score != null && (
          <p className="mt-1 text-xs font-medium text-accent">{progress.score}% de acertos</p>
        )}
      </div>

      {/* Estado */}
      <div className="shrink-0">
        {isCompleted ? (
          <CheckCircle2 className="h-6 w-6 text-accent" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
            <Play className="h-3.5 w-3.5 translate-x-0.5 text-gray-500" />
          </div>
        )}
      </div>
    </button>
  )
}

function BookStackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="7" width="16" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="12" y1="12" x2="12" y2="16" />
      <line x1="10" y1="14" x2="14" y2="14" />
    </svg>
  )
}
