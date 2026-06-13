import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { deleteTrail, listTrails } from '@/services/trails'
import type { Trail } from '@/types'

export default function ManageTrailsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: trails = [], isLoading } = useQuery({
    queryKey: ['trails'],
    queryFn: listTrails,
  })

  const remove = useMutation({
    mutationFn: deleteTrail,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trails'] }),
  })

  return (
    <div className="min-h-full px-4 py-6 pb-24">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/trails')} className="mb-1 text-sm font-medium text-primary">
            ← Trilhas
          </button>
          <h1 className="text-xl font-bold">Gerenciar trilhas</h1>
        </div>
        <Link
          to="/manage/trails/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          + Nova trilha
        </Link>
      </header>

      {isLoading ? (
        <p className="py-10 text-center text-gray-400">Carregando...</p>
      ) : trails.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-gray-500">Nenhuma trilha criada ainda.</p>
          <p className="mt-1 text-sm text-gray-400">Monte uma sequência de onboarding para o time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trails.map((trail) => (
            <ManageRow
              key={trail.id}
              trail={trail}
              onEdit={() => navigate(`/manage/trails/${trail.id}`)}
              onDelete={() => {
                if (confirm(`Excluir a trilha "${trail.title}"?`)) remove.mutate(trail.id)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ManageRow({
  trail,
  onEdit,
  onDelete,
}: {
  trail: Trail
  onEdit: () => void
  onDelete: () => void
}) {
  const total = trail.itemCount ?? trail.progress?.total ?? 0

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="h-10 w-10 shrink-0 rounded-xl" style={{ backgroundColor: trail.coverColor }} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold text-gray-900">{trail.title}</p>
          {trail.isOnboarding && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
              Onboarding
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400">
          {total} {total === 1 ? 'deck' : 'decks'}
          <span className="mx-1">·</span>
          {trail.sequential ? 'sequencial' : 'livre'}
        </p>
      </div>
      <button onClick={onEdit} className="shrink-0 text-sm font-medium text-primary">
        Editar
      </button>
      <button onClick={onDelete} className="shrink-0 text-sm font-medium text-red-500">
        Excluir
      </button>
    </div>
  )
}
