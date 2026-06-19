import { NavLink } from 'react-router-dom'
import { Home, BookOpen } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function BottomNav() {
  const { user } = useAuth()
  const canCreate = user && user.role !== 'LEARNER'

  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-gray-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm">
      <div className="mx-auto flex max-w-2xl items-center justify-around py-2">
        <NavLink to="/" end>
          {({ isActive }) => (
            <div className={`flex flex-col items-center gap-1 px-5 py-1.5 rounded-pill transition-colors ${isActive ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`rounded-pill px-3 py-1 ${isActive ? 'bg-primary/10' : ''}`}>
                <Home className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[11px] font-medium ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                Início
              </span>
            </div>
          )}
        </NavLink>

        {canCreate && (
          <NavLink to="/decks">
            {({ isActive }) => (
              <div className={`flex flex-col items-center gap-1 px-5 py-1.5 rounded-pill transition-colors ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                <div className={`rounded-pill px-3 py-1 ${isActive ? 'bg-primary/10' : ''}`}>
                  <BookOpen className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[11px] font-medium ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                  Meus decks
                </span>
              </div>
            )}
          </NavLink>
        )}
      </div>
    </nav>
  )
}
