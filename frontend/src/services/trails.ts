import { api } from './api'
import type { Assignment, AssignmentTargetType, Trail } from '@/types'

export async function listTrails() {
  const { data } = await api.get<Trail[]>('/trails')
  return data
}

export async function getTrail(id: string) {
  const { data } = await api.get<Trail>(`/trails/${id}`)
  return data
}

export interface TrailInput {
  title: string
  description?: string | null
  coverColor?: string
  isOnboarding?: boolean
  sequential?: boolean
  sectorId?: string | null
}

export async function createTrail(input: TrailInput) {
  const { data } = await api.post<Trail>('/trails', input)
  return data
}

export async function updateTrail(id: string, input: Partial<TrailInput>) {
  const { data } = await api.patch<Trail>(`/trails/${id}`, input)
  return data
}

export async function setTrailItems(id: string, items: { deckId: string; required?: boolean }[]) {
  const { data } = await api.put<Trail>(`/trails/${id}/items`, { items })
  return data
}

export async function deleteTrail(id: string) {
  await api.delete(`/trails/${id}`)
}

export async function assignTrail(
  id: string,
  input: { targetType: AssignmentTargetType; targetId?: string; dueDate?: string | null },
) {
  const { data } = await api.post<Assignment>(`/trails/${id}/assign`, input)
  return data
}
