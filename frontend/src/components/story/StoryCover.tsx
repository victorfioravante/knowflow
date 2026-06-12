import type { Deck } from '@/types'

export default function StoryCover({ deck }: { deck: Deck }) {
  const storyCount = deck._count?.stories ?? deck.stories?.length ?? 0

  return (
    <div
      className="flex min-h-[65vh] flex-col items-center justify-center rounded-2xl p-8 text-white"
      style={{ backgroundColor: deck.coverColor }}
    >
      <h1 className="text-center text-2xl font-bold leading-tight">{deck.title}</h1>
      {deck.description && (
        <p className="mt-3 text-center text-sm opacity-80 leading-relaxed">{deck.description}</p>
      )}
      {deck.knowledgeArea && (
        <span className="mt-4 rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
          {deck.knowledgeArea.name}
        </span>
      )}
      <div className="mt-6 flex items-center gap-3 text-sm opacity-70">
        {deck.createdBy && <span>Por {deck.createdBy.name}</span>}
        {deck.createdBy && storyCount > 0 && <span>·</span>}
        {storyCount > 0 && (
          <span>
            {storyCount} {storyCount === 1 ? 'story' : 'stories'}
          </span>
        )}
      </div>
    </div>
  )
}
