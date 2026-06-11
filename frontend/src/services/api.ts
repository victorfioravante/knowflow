// Axios instance com interceptors
import axios from 'axios'
import { API_URL } from '@/lib/constants'
import { supabase } from '@/lib/supabase'

export const api = axios.create({
  baseURL: `${API_URL}/api`,
})

// Anexa o access token do Supabase em toda requisição
api.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

// 401 → encerra a sessão local
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await supabase.auth.signOut()
    }
    return Promise.reject(error)
  },
)
