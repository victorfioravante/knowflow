import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CanvasEditor from '@/components/canvas/CanvasEditor'
import DeckStatusBadge from '@/components/deck/DeckStatusBadge'
import { useAuth } from '@/hooks/useAuth'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { approveDeck, getDeck, rejectDeck, submitDeck, updateDeck } from '@/services/decks'

export default function CanvasEditorPage() {
  const { deckId } = useParams<{ deckId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const { data: deck, isLoading } = useQuery({
    queryKey: ['deck', deckId],
    queryFn: () => getDeck(deckId!),
    enabled: !!deckId,
  })

  const [title, setTitle] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  useEffect(() => {
    if (deck) setTitle(deck.title)
  }, [deck])

  const invalidateDeck = () => {
    queryClient.invalidateQueries({ queryKey: ['deck', deckId] })
    queryClient.invalidateQueries({ queryKey: ['my-decks'] })
    queryClient.invalidateQueries({ queryKey: ['assigned-decks'] })
  }

  const saveTitle = useMutation({
    mutationFn: (newTitle: string) => updateDeck(deckId!, { title: newTitle }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-decks'] })
    },
  })
  const debouncedSaveTitle = useDebouncedCallback((value: string) => {
    if (value.trim()) saveTitle.mutate(value.trim())
  })

  const submit = useMutation({
    mutationFn: () => submitDeck(deckId!),
    onSuccess: invalidateDeck,
    onError: (err: { response?: { data?: { error?: string } } }) =>
      setActionError(err.response?.data?.error ?? 'Erro ao enviar para aprovação'),
  })

  const approve = useMutation({
    mutationFn: () => approveDeck(deckId!),
    onSuccess: invalidateDeck,
    onError: () => setActionError('Erro ao aprovar deck'),
  })

  const reject = useMutation({
    mutationFn: (note: string) => rejectDeck(deckId!, note),
    onSuccess: invalidateDeck,
    onError: () => setActionError('Erro ao rejeitar deck'),
  })

  if (isLoading) {
    return <p className="py-10 text-center text-gray-400">Carregando deck...</p>
  }
  if (!deck) {
    return <p className="py-10 text-center text-gray-400">Deck não encontrado</p>
  }

  const editable = deck.status === 'DRAFT' || deck.status === 'REJECTED'
  const canReview =
    deck.status === 'PENDING' && (user?.role === 'ADMIN' || user?.role === 'MANAGER')

  const handleReject = () => {
    const note = window.prompt('Motivo da rejeição (feedback para o criador):')
    if (note?.trim()) reject.mutate(note.trim())
  }

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

        {actionError && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {actionError}
          </p>
        )}

        {editable && (
          <button
            onClick={() => {
              setActionError(null)
              submit.mutate()
            }}
            disabled={submit.isPending}
            className="mt-3 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submit.isPending ? 'Enviando...' : 'Enviar para aprovação'}
          </button>
        )}

        {canReview && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => {
                setActionError(null)
                approve.mutate()
              }}
              disabled={approve.isPending}
              className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {approve.isPending ? 'Aprovando...' : 'Aprovar'}
            </button>
            <button
              onClick={handleReject}
              disabled={reject.isPending}
              className="flex-1 rounded-xl border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 disabled:opacity-60"
            >
              Rejeitar
            </button>
          </div>
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
