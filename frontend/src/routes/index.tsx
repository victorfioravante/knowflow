// React Router v6 config
import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import { useAuth } from '@/hooks/useAuth'
import InvitePage from '@/pages/auth/InvitePage'
import LoginPage from '@/pages/auth/LoginPage'
import CanvasEditorPage from '@/pages/creator/CanvasEditorPage'
import MyDecksPage from '@/pages/creator/MyDecksPage'
import TemplateGalleryPage from '@/pages/creator/TemplateGalleryPage'
import HomePage from '@/pages/learner/HomePage'
import StoryPlayerPage from '@/pages/learner/StoryPlayerPage'

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
    children: [
      // Telas com navegação inferior
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/decks', element: <MyDecksPage /> },
        ],
      },
      // Telas de tela cheia (editor e player têm toolbar própria)
      { path: '/decks/new', element: <TemplateGalleryPage /> },
      { path: '/decks/:deckId/edit', element: <CanvasEditorPage /> },
      { path: '/decks/:deckId/play', element: <StoryPlayerPage /> },
    ],
  },
])
