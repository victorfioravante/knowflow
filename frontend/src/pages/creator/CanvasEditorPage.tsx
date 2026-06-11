import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CanvasEditor from '@/components/canvas/CanvasEditor'
import DeckStatusBadge from '@/components/deck/DeckStatusBadge'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { getDeck, updateDeck } from '@/services/decks'

export default function CanvasEditorPage() {
  const { deckId } = useParams<{ deckId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: deck, isLoading } = useQuery({
    queryKey: ['deck', deckId],
    queryFn: () => getDeck(deckId!),
    enabled: !!deckId,
  })

  const [title, setTitle] = useState('')
  useEffect(() => {
    if (deck) setTitle(deck.title)
  }, [deck])

  const saveTitle = useMutation({
    mutationFn: (newTitle: string) => updateDeck(deckId!, { title: newTitle }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-decks'] })
    },
  })
  const debouncedSaveTitle = useDebouncedCallback((value: string) => {
    if (value.trim()) saveTitle.mutate(value.trim())
  })

  if (isLoading) {
    return <p className="py-10 text-center text-gray-400">Carregando deck...</p>
  }
  if (!deck) {
    return <p className="py-10 text-center text-gray-400">Deck não encontrado</p>
  }

  const editable = deck.status === 'DRAFT' || deck.status === 'REJECTED'

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/decks')} className="text-gray-500">
            ←
          </button>
          <input
            type="text"
            value={title}
            disabled={!editable}
            onChange={(e) => {
              setTitle(e.target.value)
              debouncedSaveTitle(e.target.value)
            }}
            className="min-w-0 flex-1 bg-transparent text-lg font-bold focus:outline-none disabled:text-gray-500"
          />
          <DeckStatusBadge status={deck.status} />
        </div>
        {deck.status === 'REJECTED' && deck.rejectionNote && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            Feedback: {deck.rejectionNote}
          </p>
        )}
      </header>

      {editable ? (
        <CanvasEditor deck={deck} />
      ) : (
        <p className="px-4 py-10 text-center text-sm text-gray-400">
          Este deck está {deck.status === 'PENDING' ? 'em aprovação' : 'aprovado'} e não
          pode ser editado.
        </p>
      )}
    </div>
  )
}
