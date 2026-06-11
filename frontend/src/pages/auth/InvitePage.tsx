import { FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { api } from '@/services/api'

/**
 * Página de aceite de convite.
 * O link do email de convite do Supabase redireciona para cá com a sessão
 * no hash da URL; o usuário define a senha e o registro é criado no backend.
 */
export default function InvitePage() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // O supabase-js processa o hash do convite automaticamente
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setError('Convite inválido ou expirado. Solicite um novo convite.')
      }
      setReady(true)
    })
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres')
      return
    }
    if (password !== confirm) {
      setError('As senhas não conferem')
      return
    }

    setSubmitting(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('Sessão não encontrada')

      await api.post(`/auth/accept-invite/${session.access_token}`)
      navigate('/')
    } catch {
      setError('Não foi possível concluir o convite. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!ready) return null

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-center text-3xl font-bold text-primary">Knowflow</h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          Defina sua senha para entrar no time
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Nova senha
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="confirm" className="block text-sm font-medium">
              Confirme a senha
            </label>
            <input
              id="confirm"
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-primary px-4 py-3 text-base font-semibold text-white disabled:opacity-60"
          >
            {submitting ? 'Concluindo...' : 'Entrar no Knowflow'}
          </button>
        </form>
      </div>
    </div>
  )
}
