import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const demoEmail = import.meta.env.VITE_DEMO_EMAIL
  const demoPassword = import.meta.env.VITE_DEMO_PASSWORD
  const demoEnabled = Boolean(demoEmail && demoPassword)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signIn(email, password)
      navigate('/')
    } catch {
      setError('Email ou senha inválidos')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDemoLogin() {
    if (!demoEmail || !demoPassword) return
    setError(null)
    setSubmitting(true)
    try {
      await signIn(demoEmail, demoPassword)
      navigate('/')
    } catch {
      setError('Não foi possível entrar na conta de demonstração')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-center text-3xl font-bold text-primary">Knowflow</h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          Conhecimento peer-to-peer para o seu time
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-primary px-4 py-3 text-base font-semibold text-white disabled:opacity-60"
          >
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {demoEnabled && (
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-gray-400">ou</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={submitting}
              className="mt-6 w-full rounded-lg border border-primary px-4 py-3 text-base font-semibold text-primary disabled:opacity-60"
            >
              Entrar como demonstração
            </button>
            <p className="mt-2 text-center text-xs text-gray-400">
              Acesso de leitura ao conteúdo de exemplo, sem cadastro.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
