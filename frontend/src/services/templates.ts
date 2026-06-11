import { api } from './api'
import type { Template } from '@/types'

export async function listTemplates() {
  const { data } = await api.get<Template[]>('/templates')
  return data
}
