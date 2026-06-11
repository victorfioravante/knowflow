import { useAuth } from '@/hooks/useAuth'

// Feed de decks e revisões pendentes (conteúdo chega na Semana 5–6)
export default function HomePage() {
  const { user, signOut } = useAuth()

  return (
    <div className="flex min-h-full flex-col px-6 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Olá, {user?.name?.split(' ')[0]}</h1>
          <p className="text-sm text-gray-500">{user?.organization?.name}</p>
        </div>
        <button onClick={signOut} className="text-sm font-medium text-primary">
          Sair
        </button>
      </header>

      <div className="mt-12 flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-gray-500">
          Seu feed de decks e revisões aparecerá aqui em breve.
        </p>
      </div>
    </div>
  )
}
