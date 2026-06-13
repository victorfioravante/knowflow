import { api } from './api'
import type { Sector } from '@/types'

export async function listSectors() {
  const { data } = await api.get<Sector[]>('/sectors')
  return data
}
