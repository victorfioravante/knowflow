import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { listDecks } from '@/services/decks'
import { listSectors } from '@/services/org'
import {
  assignTrail,
  createTrail,
  getTrail,
  setTrailItems,
  updateTrail,
} from '@/services/trails'
import type { AssignmentTargetType } from '@/types'

interface SelectedItem {
  deckId: string
  title: string
  coverColor: string
  required: boolean
}

export default function TrailEditorPage() {
  const { trailId } = useParams<{ trailId: string }>()
  const isEdit = !!trailId
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [coverColor, setCoverColor] = useState('#1D9E75')
  const [isOnboarding, setIsOnboarding] = useState(false)
  const [sequential, setSequential] = useState(true)
  const [selected, setSelected] = useState<SelectedItem[]>([])
  const [error, setError] = useState<string | null>(null)

  const { data: approvedDecks = [] } = useQuery({
    queryKey: ['decks', { status: 'APPROVED' }],
    queryFn: () => listDecks({ status: 'APPROVED' }),
  })

  const { data: trail } = useQuery({
    queryKey: ['trail', trailId],
    queryFn: () => getTrail(trailId!),
    enabled: isEdit,
  })

  // Prefill no modo edição
  useEffect(() => {
    if (!trail) return
    setTitle(trail.title)
    setDescription(trail.description ?? '')
    setCoverColor(trail.coverColor)
    setIsOnboarding(trail.isOnboarding)
    setSequential(trail.sequential)
    setSelected(
      (trail.items ?? []).map((it) => ({
        deckId: it.deckId,
        title: it.deck?.title ?? 'Deck',
        coverColor: it.deck?.coverColor ?? '#1D9E75',
        required: it.required,
      })),
    )
  }, [trail])

  const selectedIds = new Set(selected.map((s) => s.deckId))
  const available = approvedDecks.filter((d) => !selectedIds.has(d.id))

  function addDeck(deckId: string, deckTitle: string, color: string) {
    setSelected((prev) => [...prev, { deckId, title: deckTitle, coverColor: color, required: true }])
  }
  function removeDeck(deckId: string) {
    setSelected((prev) => prev.filter((s) => s.deckId !== deckId))
  }
  function move(index: number, dir: -1 | 1) {
    setSelected((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }
  function toggleRequired(deckId: string) {
    setSelected((prev) =>
      prev.map((s) => (s.deckId === deckId ? { ...s, required: !s.required } : s)),
    )
  }

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        coverColor,
        isOnboarding,
        sequential,
      }
      const trailRecord = isEdit
        ? await updateTrail(trailId!, payload)
        : await createTrail(payload)
      await setTrailItems(
        trailRecord.id,
        selected.map((s) => ({ deckId: s.deckId, required: s.required })),
      )
      return trailRecord.id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['trails'] })
      queryClient.invalidateQueries({ queryKey: ['trail', id] })
      navigate('/manage/trails')
    },
    onError: () => setError('Não foi possível salvar a trilha. Verifique os campos.'),
  })

  function handleSave() {
    setError(null)
    if (!title.trim()) {
      setError('Dê um título à trilha.')
      return
    }
    save.mutate()
  }

  return (
    <div className="min-h-full px-4 py-6 pb-28">
      <header className="mb-5">
        <button onClick={() => navigate('/manage/trails')} className="mb-1 text-sm font-medium text-primary">
          ← Gerenciar trilhas
        </button>
        <h1 className="text-xl font-bold">{isEdit ? 'Editar trilha' : 'Nova trilha'}</h1>
      </header>

      {/* Campos */}
      <section className="space-y-4">
        <Field label="Título">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Onboarding de Vendas"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </Field>

        <Field label="Descrição">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="O que o time vai aprender nesta trilha?"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </Field>

        <div className="flex items-center gap-4">
          <Field label="Cor">
            <input
              type="color"
              value={coverColor}
              onChange={(e) => setCoverColor(e.target.value)}
              className="h-10 w-16 cursor-pointer rounded-lg border border-gray-300"
            />
          </Field>
          <div className="flex flex-1 flex-col gap-2 pt-5">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isOnboarding} onChange={(e) => setIsOnboarding(e.target.checked)} />
              Trilha de onboarding
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={sequential} onChange={(e) => setSequential(e.target.checked)} />
              Sequencial (libera um passo por vez)
            </label>
          </div>
        </div>
      </section>

      {/* Decks selecionados */}
      <section className="mt-6">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Decks da trilha ({selected.length})
        </h2>
        {selected.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400">
            Adicione decks aprovados abaixo para montar a sequência.
          </p>
        ) : (
          <ol className="space-y-2">
            {selected.map((item, index) => (
              <li
                key={item.deckId}
                className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  {index + 1}
                </span>
                <div className="h-7 w-7 shrink-0 rounded-md" style={{ backgroundColor: item.coverColor }} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.title}</span>
                <label className="flex shrink-0 items-center gap-1 text-[11px] text-gray-500">
                  <input type="checkbox" checked={item.required} onChange={() => toggleRequired(item.deckId)} />
                  obrig.
                </label>
                <button
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="shrink-0 px-1 text-gray-400 disabled:opacity-30"
                  aria-label="Mover para cima"
                >
                  ↑
                </button>
                <button
                  onClick={() => move(index, 1)}
                  disabled={index === selected.length - 1}
                  className="shrink-0 px-1 text-gray-400 disabled:opacity-30"
                  aria-label="Mover para baixo"
                >
                  ↓
                </button>
                <button
                  onClick={() => removeDeck(item.deckId)}
                  className="shrink-0 px-1 text-red-400"
                  aria-label="Remover"
                >
                  ✕
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Decks disponíveis */}
      <section className="mt-5">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Decks aprovados disponíveis
        </h2>
        {available.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum deck aprovado disponível para adicionar.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {available.map((deck) => (
              <button
                key={deck.id}
                onClick={() => addDeck(deck.id, deck.title, deck.coverColor)}
                className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-sm hover:border-primary hover:text-primary"
              >
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: deck.coverColor }} />
                {deck.title}
                <span className="text-gray-400">+</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSave}
        disabled={save.isPending}
        className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-base font-semibold text-white disabled:opacity-60"
      >
        {save.isPending ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar trilha'}
      </button>

      {/* Atribuição (só ao editar uma trilha existente) */}
      {isEdit && <AssignSection trailId={trailId!} />}
    </div>
  )
}

function AssignSection({ trailId }: { trailId: string }) {
  const [targetType, setTargetType] = useState<AssignmentTargetType>('ORGANIZATION')
  const [sectorId, setSectorId] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  const { data: sectors = [] } = useQuery({ queryKey: ['sectors'], queryFn: listSectors })

  const assign = useMutation({
    mutationFn: () =>
      assignTrail(trailId, {
        targetType,
        targetId: targetType === 'SECTOR' ? sectorId : undefined,
      }),
    onSuccess: () => setFeedback('Trilha atribuída com sucesso.'),
    onError: () => setFeedback('Não foi possível atribuir. Selecione um alvo válido.'),
  })

  const canAssign = targetType === 'ORGANIZATION' || (targetType === 'SECTOR' && sectorId)

  return (
    <section className="mt-8 rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <h2 className="font-semibold text-gray-900">Atribuir trilha</h2>
      <p className="mt-0.5 text-sm text-gray-500">Defina quem deve concluir esta trilha.</p>

      <div className="mt-3 space-y-3">
        <select
          value={targetType}
          onChange={(e) => {
            setTargetType(e.target.value as AssignmentTargetType)
            setFeedback(null)
          }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
        >
          <option value="ORGANIZATION">Toda a organização</option>
          <option value="SECTOR">Um setor específico</option>
        </select>

        {targetType === 'SECTOR' && (
          <select
            value={sectorId}
            onChange={(e) => setSectorId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
          >
            <option value="">Selecione o setor...</option>
            {sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={() => {
            setFeedback(null)
            assign.mutate()
          }}
          disabled={!canAssign || assign.isPending}
          className="w-full rounded-lg border border-primary px-4 py-2.5 font-semibold text-primary disabled:opacity-50"
        >
          {assign.isPending ? 'Atribuindo...' : 'Atribuir'}
        </button>

        {feedback && <p className="text-sm text-gray-600">{feedback}</p>}
      </div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
    </div>
  )
}
