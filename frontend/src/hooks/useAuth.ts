import { useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import type { User } from '@/types'

export function useAuth() {
  const { user, status, setUser, setStatus } = useAuthStore()

  // Verifica a sessão no backend e carrega o usuário da plataforma
  const verify = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      setUser(null)
      return
    }
    try {
      const { data } = await api.post<User>('/auth/verify')
      setUser(data)
    } catch {
      setUser(null)
    }
  }, [setUser])

  useEffect(() => {
    verify()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setUser(null)
      if (event === 'SIGNED_IN') verify()
    })
    return () => subscription.unsubscribe()
  }, [verify, setUser])

  const signIn = useCallback(
    async (email: string, password: string) => {
      setStatus('loading')
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setStatus('unauthenticated')
        throw error
      }
      await verify()
    },
    [setStatus, verify],
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
  }, [setUser])

  return { user, status, signIn, signOut }
}
