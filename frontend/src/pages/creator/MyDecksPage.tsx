import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import DeckCard from '@/components/deck/DeckCard'
import { listMyDecks } from '@/services/decks'

export default function MyDecksPage() {
  const { data: decks, isLoading } = useQuery({
    queryKey: ['my-decks'],
    queryFn: listMyDecks,
  })

  return (
    <div className="px-4 py-6 pb-24">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Meus decks</h1>
        <Link
          to="/decks/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          + Novo deck
        </Link>
      </header>

      {isLoading && <p className="py-10 text-center text-gray-400">Carregando...</p>}

      {decks && decks.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-gray-500">Você ainda não criou nenhum deck.</p>
          <p className="mt-1 text-sm text-gray-400">
            Compartilhe o que você sabe com o time!
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {decks?.map((deck) => (
          <DeckCard key={deck.id} deck={deck} to={`/decks/${deck.id}/edit`} />
        ))}
      </div>
    </div>
  )
}
