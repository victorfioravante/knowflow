import { api } from './api'
import type { Deck } from '@/types'

export interface DeckFilters {
  status?: string
  knowledgeAreaId?: string
  sectorId?: string
}

export async function listDecks(filters: DeckFilters = {}) {
  const { data } = await api.get<Deck[]>('/decks', { params: filters })
  return data
}

export async function listMyDecks() {
  const { data } = await api.get<Deck[]>('/decks/my')
  return data
}

export async function getDeck(id: string) {
  const { data } = await api.get<Deck>(`/decks/${id}`)
  return data
}

export async function createDeck(input: {
  title: string
  description?: string | null
  coverColor?: string
  sectorId?: string | null
  knowledgeAreaId?: string | null
}) {
  const { data } = await api.post<Deck>('/decks', input)
  return data
}

export async function createDeckFromTemplate(templateId: string, title?: string) {
  const { data } = await api.post<Deck>(`/decks/from-template/${templateId}`, { title })
  return data
}

export async function updateDeck(id: string, input: Partial<Parameters<typeof createDeck>[0]>) {
  const { data } = await api.patch<Deck>(`/decks/${id}`, input)
  return data
}

export async function deleteDeck(id: string) {
  await api.delete(`/decks/${id}`)
}

export async function submitDeck(id: string) {
  const { data } = await api.post<Deck>(`/decks/${id}/submit`)
  return data
}

export async function approveDeck(id: string) {
  const { data } = await api.post<Deck>(`/decks/${id}/approve`)
  return data
}

export async function rejectDeck(id: string, note: string) {
  const { data } = await api.post<Deck>(`/decks/${id}/reject`, { note })
  return data
}

export async function listAssignedDecks() {
  const { data } = await api.get<Deck[]>('/decks/assigned')
  return data
}

export async function completeDeck(id: string) {
  await api.post(`/progress/deck/${id}/complete`)
}

export async function saveDeckQuizScore(id: string, score: number) {
  await api.post(`/progress/deck/${id}/quiz-score`, { score })
}
