import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { getTrail } from '@/services/trails'
import type { TrailItem } from '@/types'

export default function TrailDetailPage() {
  const { trailId } = useParams<{ trailId: string }>()
  const navigate = useNavigate()

  const { data: trail, isLoading } = useQuery({
    queryKey: ['trail', trailId],
    queryFn: () => getTrail(trailId!),
    enabled: !!trailId,
  })

  if (isLoading) {
    return <div className="flex min-h-full items-center justify-center text-gray-400">Carregando...</div>
  }
  if (!trail) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-4 text-center">
        <p className="font-semibold text-gray-700">Trilha não encontrada</p>
        <button onClick={() => navigate('/trails')} className="mt-3 text-sm font-medium text-primary">
          Voltar para trilhas
        </button>
      </div>
    )
  }

  const items = trail.items ?? []
  const progress = trail.progress
  const percent = progress?.percent ?? 0

  return (
    <div className="min-h-full pb-8">
      {/* Capa */}
      <header className="px-4 py-5 text-white" style={{ backgroundColor: trail.coverColor }}>
        <button onClick={() => navigate('/trails')} className="mb-3 text-sm font-medium text-white/90">
          ← Trilhas
        </button>
        <h1 className="text-2xl font-bold">{trail.title}</h1>
        {trail.description && <p className="mt-1 text-sm text-white/90">{trail.description}</p>}

        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/30">
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${percent}%` }} />
          </div>
          <span className="shrink-0 text-sm font-semibold">
            {progress?.completed ?? 0}/{progress?.total ?? items.length}
          </span>
        </div>
      </header>

      {/* Conclusão */}
      {progress?.isComplete && items.length > 0 && (
        <div className="mx-4 mt-4 rounded-2xl bg-green-50 p-4 text-center">
          <p className="text-2xl">🎉</p>
          <p className="mt-1 font-semibold text-green-700">Trilha concluída!</p>
          <p className="text-sm text-green-600">Você completou todos os passos obrigatórios.</p>
        </div>
      )}

      {/* CTA continuar */}
      {!progress?.isComplete && progress?.nextDeckId && (
        <div className="px-4 pt-4">
          <button
            onClick={() => navigate(`/decks/${progress.nextDeckId}/play`)}
            className="w-full rounded-xl bg-primary px-4 py-3 text-base font-semibold text-white"
          >
            {progress.completed === 0 ? 'Começar trilha' : 'Continuar de onde parei'}
          </button>
        </div>
      )}

      {/* Stepper vertical */}
      <ol className="px-4 pt-6">
        {items.map((item, index) => (
          <TrailStep
            key={item.id}
            item={item}
            index={index}
            isLast={index === items.length - 1}
            onClick={() => item.unlocked && navigate(`/decks/${item.deckId}/play`)}
          />
        ))}
      </ol>
    </div>
  )
}

function TrailStep({
  item,
  index,
  isLast,
  onClick,
}: {
  item: TrailItem
  index: number
  isLast: boolean
  onClick: () => void
}) {
  const completed = !!item.completed
  const locked = item.unlocked === false
  const storyCount = item.deck?._count?.stories ?? 0

  return (
    <li className="flex gap-3">
      {/* Trilho + marcador */}
      <div className="flex flex-col items-center">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            completed
              ? 'bg-green-500 text-white'
              : locked
                ? 'bg-gray-100 text-gray-300'
                : 'bg-primary text-white'
          }`}
        >
          {completed ? '✓' : locked ? '🔒' : index + 1}
        </div>
        {!isLast && (
          <div className={`w-0.5 flex-1 ${completed ? 'bg-green-500' : 'bg-gray-200'}`} />
        )}
      </div>

      {/* Card do passo */}
      <button
        onClick={onClick}
        disabled={locked}
        className={`mb-3 flex-1 rounded-xl border p-3 text-left transition-all ${
          locked
            ? 'cursor-not-allowed border-gray-100 bg-gray-50'
            : 'border-gray-100 bg-white shadow-sm hover:shadow-md active:scale-[0.99]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-lg" style={{ backgroundColor: item.deck?.coverColor }} />
          <div className="min-w-0 flex-1">
            <p className={`truncate font-semibold ${locked ? 'text-gray-400' : 'text-gray-900'}`}>
              {item.deck?.title ?? 'Deck'}
            </p>
            <p className="text-xs text-gray-400">
              {storyCount} {storyCount === 1 ? 'story' : 'stories'}
              {!item.required && <span className="ml-1">· opcional</span>}
              {locked && <span className="ml-1">· conclua o passo anterior</span>}
            </p>
          </div>
          {completed && <span className="shrink-0 text-xs font-medium text-green-500">Concluído</span>}
        </div>
      </button>
    </li>
  )
}
