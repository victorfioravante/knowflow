import { api } from './api'
import type { Block, BlockData, BlockType, Story } from '@/types'

// ─── Stories ───────────────────────────────────────────────

export async function createStory(deckId: string) {
  const { data } = await api.post<Story>(`/decks/${deckId}/stories`)
  return data
}

export async function reorderStories(deckId: string, storyIds: string[]) {
  await api.patch(`/decks/${deckId}/stories/reorder`, { storyIds })
}

export async function deleteStory(deckId: string, storyId: string) {
  await api.delete(`/decks/${deckId}/stories/${storyId}`)
}

// ─── Blocks ────────────────────────────────────────────────

export async function createBlock(storyId: string, type: BlockType) {
  const { data } = await api.post<Block>(`/stories/${storyId}/blocks`, { type })
  return data
}

export async function updateBlock(storyId: string, blockId: string, data: BlockData) {
  const { data: block } = await api.patch<Block>(
    `/stories/${storyId}/blocks/${blockId}`,
    { data },
  )
  return block
}

export async function reorderBlocks(storyId: string, blockIds: string[]) {
  await api.patch(`/stories/${storyId}/blocks/reorder`, { blockIds })
}

export async function deleteBlock(storyId: string, blockId: string) {
  await api.delete(`/stories/${storyId}/blocks/${blockId}`)
}
