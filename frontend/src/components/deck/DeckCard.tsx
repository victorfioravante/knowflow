import { Link } from 'react-router-dom'
import type { Deck } from '@/types'
import DeckStatusBadge from './DeckStatusBadge'

interface Props {
  deck: Deck
  to: string
}

export default function DeckCard({ deck, to }: Props) {
  return (
    <Link
      to={to}
      className="block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
    >
      <div className="h-2" style={{ backgroundColor: deck.coverColor }} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-snug">{deck.title}</h3>
          <DeckStatusBadge status={deck.status} />
        </div>
        {deck.description && (
          <p className="mt-1 line-clamp-2 text-sm text-gray-500">{deck.description}</p>
        )}
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
          {deck.knowledgeArea && (
            <span
              className="rounded-full px-2 py-0.5 text-white"
              style={{ backgroundColor: deck.knowledgeArea.color }}
            >
              {deck.knowledgeArea.name}
            </span>
          )}
          <span>{deck._count?.stories ?? 0} stories</span>
        </div>
      </div>
    </Link>
  )
}
