import { describe, it, expect, vi } from 'vitest'

// Prevent PrismaClient instantiation — these tests exercise pure logic only
vi.mock('../lib/prisma', () => ({ prisma: {} }))

import { computeTrailProgress, normalizeTrailItems } from '../controllers/trails.controller'
import type { TrailItemProgressInput } from '../controllers/trails.controller'

const item = (deckId: string, order: number, required = true): TrailItemProgressInput => ({
  deckId,
  order,
  required,
})

describe('computeTrailProgress', () => {
  it('handles an empty trail', () => {
    const result = computeTrailProgress([], new Set())
    expect(result).toEqual({ total: 0, completed: 0, percent: 0, nextDeckId: null, isComplete: true })
  })

  it('reports nothing completed and points at the first deck', () => {
    const items = [item('a', 0), item('b', 1), item('c', 2)]
    const result = computeTrailProgress(items, new Set())
    expect(result.total).toBe(3)
    expect(result.completed).toBe(0)
    expect(result.percent).toBe(0)
    expect(result.nextDeckId).toBe('a')
    expect(result.isComplete).toBe(false)
  })

  it('points at the first incomplete deck in order', () => {
    const items = [item('a', 0), item('b', 1), item('c', 2)]
    const result = computeTrailProgress(items, new Set(['a']))
    expect(result.completed).toBe(1)
    expect(result.percent).toBe(33)
    expect(result.nextDeckId).toBe('b')
    expect(result.isComplete).toBe(false)
  })

  it('respects order even when items are given out of order', () => {
    const items = [item('c', 2), item('a', 0), item('b', 1)]
    const result = computeTrailProgress(items, new Set(['a']))
    // próximo na ordem (0,1,2) é o "b", não o "c"
    expect(result.nextDeckId).toBe('b')
  })

  it('marks a fully completed trail as complete with no next deck', () => {
    const items = [item('a', 0), item('b', 1)]
    const result = computeTrailProgress(items, new Set(['a', 'b']))
    expect(result.percent).toBe(100)
    expect(result.nextDeckId).toBeNull()
    expect(result.isComplete).toBe(true)
  })

  it('is complete when all REQUIRED items are done, ignoring optional ones', () => {
    const items = [item('a', 0, true), item('b', 1, false)]
    const result = computeTrailProgress(items, new Set(['a']))
    expect(result.isComplete).toBe(true)
    // o item opcional ainda aparece como próximo sugerido
    expect(result.nextDeckId).toBe('b')
    expect(result.percent).toBe(50)
  })

  it('rounds the percentage to the nearest integer', () => {
    const items = [item('a', 0), item('b', 1), item('c', 2)]
    const result = computeTrailProgress(items, new Set(['a', 'b']))
    expect(result.percent).toBe(67) // 2/3 = 66.66... → 67
  })
})

describe('normalizeTrailItems', () => {
  it('assigns sequential order by list position', () => {
    const result = normalizeTrailItems([{ deckId: 'x' }, { deckId: 'y' }, { deckId: 'z' }])
    expect(result).toEqual([
      { deckId: 'x', order: 0, required: true },
      { deckId: 'y', order: 1, required: true },
      { deckId: 'z', order: 2, required: true },
    ])
  })

  it('defaults required to true and respects an explicit false', () => {
    const result = normalizeTrailItems([{ deckId: 'x', required: false }, { deckId: 'y' }])
    expect(result[0].required).toBe(false)
    expect(result[1].required).toBe(true)
  })

  it('drops duplicate decks keeping the first occurrence', () => {
    const result = normalizeTrailItems([
      { deckId: 'x' },
      { deckId: 'y' },
      { deckId: 'x', required: false }, // duplicata ignorada
    ])
    expect(result).toEqual([
      { deckId: 'x', order: 0, required: true },
      { deckId: 'y', order: 1, required: true },
    ])
  })

  it('returns an empty list for no items', () => {
    expect(normalizeTrailItems([])).toEqual([])
  })

  it('reindexes order contiguously after dropping duplicates', () => {
    const result = normalizeTrailItems([{ deckId: 'a' }, { deckId: 'a' }, { deckId: 'b' }])
    expect(result.map((i) => i.order)).toEqual([0, 1])
  })
})
