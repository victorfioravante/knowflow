import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { listTrails } from '@/services/trails'
import type { Trail } from '@/types'

export default function TrailsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const { data: trails = [], isLoading } = useQuery({
    queryKey: ['trails'],
    queryFn: listTrails,
  })

  return (
    <div className="min-h-full px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Trilhas</h1>
          <p className="text-sm text-gray-500">Sequências guiadas de aprendizado</p>
        </div>
        {canManage && (
          <Link to="/manage/trails" className="text-sm font-medium text-primary">
            Gerenciar
          </Link>
        )}
      </header>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <p className="text-gray-400">Carregando...</p>
        </div>
      ) : trails.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="mb-3 text-4xl">🧭</p>
          <p className="font-semibold text-gray-700">Nenhuma trilha disponível</p>
          <p className="mt-1 text-sm text-gray-400">Aguarde seu gestor montar uma trilha.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trails.map((trail) => (
            <TrailCard key={trail.id} trail={trail} onClick={() => navigate(`/trails/${trail.id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}

function TrailCard({ trail, onClick }: { trail: Trail; onClick: () => void }) {
  const percent = trail.progress?.percent ?? 0
  const completed = trail.progress?.completed ?? 0
  const total = trail.progress?.total ?? trail.itemCount ?? 0
  const isComplete = trail.progress?.isComplete && total > 0

  return (
    <button
      onClick={onClick}
      className="block w-full overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
    >
      <div className="flex items-center gap-2 px-4 pt-4">
        {trail.isOnboarding && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            Onboarding
          </span>
        )}
        {isComplete && <span className="text-sm text-green-500">✓ Concluída</span>}
      </div>

      <div className="px-4 py-3">
        <p className="font-semibold text-gray-900">{trail.title}</p>
        {trail.description && (
          <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">{trail.description}</p>
        )}

        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${percent}%`, backgroundColor: trail.coverColor }}
            />
          </div>
          <span className="shrink-0 text-xs font-medium text-gray-500">
            {completed}/{total}
          </span>
        </div>
      </div>
    </button>
  )
}
