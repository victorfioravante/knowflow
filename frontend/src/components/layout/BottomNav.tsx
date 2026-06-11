// Navegação mobile
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  `flex flex-col items-center gap-0.5 px-4 py-1.5 text-xs font-medium ${
    isActive ? 'text-primary' : 'text-gray-500'
  }`

export default function BottomNav() {
  const { user } = useAuth()
  const canCreate = user && user.role !== 'LEARNER'

  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-2xl items-center justify-around py-1.5">
        <NavLink to="/" end className={linkClasses}>
          <span className="text-lg leading-none">🏠</span>
          Início
        </NavLink>
        {canCreate && (
          <NavLink to="/decks" className={linkClasses}>
            <span className="text-lg leading-none">✏️</span>
            Meus decks
          </NavLink>
        )}
      </div>
    </nav>
  )
}
