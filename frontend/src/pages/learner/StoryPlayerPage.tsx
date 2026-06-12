import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import StoryPlayer from '@/components/story/StoryPlayer'
import { getDeck } from '@/services/decks'

export default function StoryPlayerPage() {
  const { deckId } = useParams<{ deckId: string }>()

  const { data: deck, isLoading } = useQuery({
    queryKey: ['deck', deckId],
    queryFn: () => getDeck(deckId!),
    enabled: !!deckId,
  })

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-900">
        <p className="text-white/50">Carregando...</p>
      </div>
    )
  }

  if (!deck) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-900">
        <p className="text-white/50">Deck não encontrado</p>
      </div>
    )
  }

  return <StoryPlayer deck={deck} />
}
