import { describe, it, expect, vi } from 'vitest'

// Prevent PrismaClient instantiation — these tests exercise pure logic only
vi.mock('../lib/prisma', () => ({ prisma: {} }))

import { canEditDeck, createDeckSchema, rejectDeckSchema } from '../controllers/decks.controller'
import { DeckStatus, UserRole } from '@prisma/client'
import type { Deck, User } from '@prisma/client'

const makeUser = (overrides: Record<string, unknown> = {}): User =>
  ({ id: 'user-1', role: UserRole.CONTRIBUTOR, ...overrides } as unknown as User)

const makeDeck = (overrides: Record<string, unknown> = {}): Deck =>
  ({ id: 'deck-1', createdById: 'user-1', status: DeckStatus.DRAFT, ...overrides } as unknown as Deck)

// ─── canEditDeck ───────────────────────────────────────────────────────────────

describe('canEditDeck', () => {
  describe('status restrictions', () => {
    it('allows editing a DRAFT deck', () => {
      expect(canEditDeck(makeUser(), makeDeck({ status: DeckStatus.DRAFT }))).toEqual({ ok: true })
    })

    it('allows editing a REJECTED deck (can be revised)', () => {
      expect(canEditDeck(makeUser(), makeDeck({ status: DeckStatus.REJECTED }))).toEqual({ ok: true })
    })

    it('blocks editing a PENDING deck', () => {
      const result = canEditDeck(makeUser(), makeDeck({ status: DeckStatus.PENDING }))
      expect(result.ok).toBe(false)
      expect(result.error).toMatch(/status/)
    })

    it('blocks editing an APPROVED deck', () => {
      const result = canEditDeck(makeUser(), makeDeck({ status: DeckStatus.APPROVED }))
      expect(result.ok).toBe(false)
      expect(result.error).toMatch(/status/)
    })
  })

  describe('ownership and role', () => {
    it('allows the deck owner to edit', () => {
      const user = makeUser({ id: 'owner' })
      const deck = makeDeck({ createdById: 'owner' })
      expect(canEditDeck(user, deck)).toEqual({ ok: true })
    })

    it('blocks a non-owner CONTRIBUTOR', () => {
      const user = makeUser({ id: 'other-user', role: UserRole.CONTRIBUTOR })
      const deck = makeDeck({ createdById: 'owner' })
      const result = canEditDeck(user, deck)
      expect(result.ok).toBe(false)
      expect(result.error).toMatch(/Permissão/)
    })

    it('allows a MANAGER to edit any DRAFT (approval workflow)', () => {
      const manager = makeUser({ id: 'manager', role: UserRole.MANAGER })
      const deck = makeDeck({ createdById: 'someone-else', status: DeckStatus.DRAFT })
      expect(canEditDeck(manager, deck)).toEqual({ ok: true })
    })

    it('allows an ADMIN to edit any DRAFT', () => {
      const admin = makeUser({ id: 'admin', role: UserRole.ADMIN })
      const deck = makeDeck({ createdById: 'someone-else', status: DeckStatus.DRAFT })
      expect(canEditDeck(admin, deck)).toEqual({ ok: true })
    })

    it('blocks a MANAGER from editing a PENDING deck (status wins over role)', () => {
      const manager = makeUser({ id: 'manager', role: UserRole.MANAGER })
      const deck = makeDeck({ createdById: 'someone-else', status: DeckStatus.PENDING })
      const result = canEditDeck(manager, deck)
      expect(result.ok).toBe(false)
      expect(result.error).toMatch(/status/)
    })
  })
})

// ─── createDeckSchema ──────────────────────────────────────────────────────────

describe('createDeckSchema', () => {
  it('accepts a minimal valid deck', () => {
    expect(createDeckSchema.safeParse({ title: 'My Deck' }).success).toBe(true)
  })

  it('rejects an empty title', () => {
    expect(createDeckSchema.safeParse({ title: '' }).success).toBe(false)
  })

  it('rejects a title longer than 160 characters', () => {
    expect(createDeckSchema.safeParse({ title: 'a'.repeat(161) }).success).toBe(false)
  })

  it('accepts exactly 160-character title', () => {
    expect(createDeckSchema.safeParse({ title: 'a'.repeat(160) }).success).toBe(true)
  })

  it('accepts a valid hex coverColor', () => {
    expect(createDeckSchema.safeParse({ title: 'X', coverColor: '#1D9E75' }).success).toBe(true)
  })

  it('rejects a non-hex coverColor', () => {
    expect(createDeckSchema.safeParse({ title: 'X', coverColor: 'green' }).success).toBe(false)
  })
})

// ─── rejectDeckSchema ──────────────────────────────────────────────────────────

describe('rejectDeckSchema', () => {
  it('accepts a valid rejection note', () => {
    expect(rejectDeckSchema.safeParse({ note: 'Needs more context' }).success).toBe(true)
  })

  it('rejects an empty note (feedback must be actionable)', () => {
    expect(rejectDeckSchema.safeParse({ note: '' }).success).toBe(false)
  })

  it('rejects a note over 500 characters', () => {
    expect(rejectDeckSchema.safeParse({ note: 'x'.repeat(501) }).success).toBe(false)
  })

  it('accepts exactly 500-character note', () => {
    expect(rejectDeckSchema.safeParse({ note: 'x'.repeat(500) }).success).toBe(true)
  })
})
