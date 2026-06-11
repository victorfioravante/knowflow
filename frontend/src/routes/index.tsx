// React Router v6 config
import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import InvitePage from '@/pages/auth/InvitePage'
import LoginPage from '@/pages/auth/LoginPage'
import HomePage from '@/pages/learner/HomePage'

function ProtectedLayout() {
  const { status } = useAuth()
  if (status === 'loading') {
    return (
      <div className="flex min-h-full items-center justify-center text-gray-400">
        Carregando...
      </div>
    )
  }
  if (status === 'unauthenticated') return <Navigate to="/login" replace />
  return <Outlet />
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/invite', element: <InvitePage /> },
  {
    element: <ProtectedLayout />,
    children: [{ path: '/', element: <HomePage /> }],
  },
])
