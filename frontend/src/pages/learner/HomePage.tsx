import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { listAssignedDecks } from '@/services/decks'
import type { Deck, DeckProgress } from '@/types'

export default function HomePage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const { data: decks = [], isLoading } = useQuery({
    queryKey: ['assigned-decks'],
    queryFn: listAssignedDecks,
  })

  const completed = decks.filter((d) => d.progress?.completedAt)
  const pending = decks.filter((d) => !d.progress?.completedAt)

  return (
    <div className="min-h-full px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Olá, {user?.name?.split(' ')[0]}</h1>
          <p className="text-sm text-gray-500">{user?.organization?.name}</p>
        </div>
        <button onClick={signOut} className="text-sm font-medium text-primary">
          Sair
        </button>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <p className="text-gray-400">Carregando...</p>
        </div>
      ) : decks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-4xl mb-3">📚</p>
          <p className="font-semibold text-gray-700">Nenhum conteúdo disponível</p>
          <p className="text-sm text-gray-400 mt-1">Aguarde seu gestor publicar conteúdo.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Para você
              </h2>
              <div className="space-y-3">
                {pending.map((deck) => (
                  <DeckFeedCard
                    key={deck.id}
                    deck={deck}
                    progress={deck.progress ?? null}
                    onClick={() => navigate(`/decks/${deck.id}/play`)}
                  />
                ))}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Concluídos
              </h2>
              <div className="space-y-3">
                {completed.map((deck) => (
                  <DeckFeedCard
                    key={deck.id}
                    deck={deck}
                    progress={deck.progress ?? null}
                    onClick={() => navigate(`/decks/${deck.id}/play`)}
                  />
                ))}
              </div>
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
      className="flex w-full items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-all active:scale-[0.98] hover:shadow-md"
    >
      <div
        className="h-14 w-14 shrink-0 rounded-xl"
        style={{ backgroundColor: deck.coverColor }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-gray-900">{deck.title}</p>
        <p className="mt-0.5 text-xs text-gray-500">
          {storyCount} {storyCount === 1 ? 'story' : 'stories'}
          {deck.knowledgeArea && (
            <>
              <span className="mx-1">·</span>
              <span
                className="inline-block rounded-full px-1.5 py-0.5 text-white text-[10px] font-medium"
                style={{ backgroundColor: deck.knowledgeArea.color }}
              >
                {deck.knowledgeArea.name}
              </span>
            </>
          )}
        </p>
        {progress?.score !== null && progress?.score !== undefined && (
          <p className="mt-0.5 text-xs font-medium text-accent">{progress.score}% de acertos</p>
        )}
      </div>
      <div className="shrink-0 text-xl">
        {isCompleted ? (
          <span className="text-green-500">✓</span>
        ) : (
          <span className="text-gray-300">▶</span>
        )}
      </div>
    </button>
  )
}
