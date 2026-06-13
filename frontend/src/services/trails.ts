import { api } from './api'
import type { Trail } from '@/types'

export async function listTrails() {
  const { data } = await api.get<Trail[]>('/trails')
  return data
}

export async function getTrail(id: string) {
  const { data } = await api.get<Trail>(`/trails/${id}`)
  return data
}
