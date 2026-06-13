import { describe, it, expect, vi } from 'vitest'

// Prevent PrismaClient instantiation — these tests exercise pure logic only
vi.mock('../lib/prisma', () => ({ prisma: {} }))

import { parseBlockData } from '../controllers/blocks.controller'
import { BlockType } from '@prisma/client'

describe('parseBlockData', () => {
  describe('QUIZ', () => {
    const valid = {
      question: 'Qual a tensão limite de baixa tensão?',
      options: ['1000V', '500V', '1500V'],
      correctIndex: 0,
    }

    it('accepts a valid quiz', () => {
      expect(parseBlockData(BlockType.QUIZ, valid).ok).toBe(true)
    })

    it('rejects correctIndex out of options range', () => {
      const result = parseBlockData(BlockType.QUIZ, { ...valid, correctIndex: 5 })
      expect(result.ok).toBe(false)
    })

    it('accepts correctIndex pointing at the last option', () => {
      const result = parseBlockData(BlockType.QUIZ, { ...valid, correctIndex: 2 })
      expect(result.ok).toBe(true)
    })

    it('rejects fewer than 2 options', () => {
      expect(parseBlockData(BlockType.QUIZ, { ...valid, options: ['só uma'] }).ok).toBe(false)
    })

    it('rejects more than 6 options', () => {
      const options = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
      expect(parseBlockData(BlockType.QUIZ, { ...valid, options }).ok).toBe(false)
    })

    it('rejects a negative correctIndex', () => {
      expect(parseBlockData(BlockType.QUIZ, { ...valid, correctIndex: -1 }).ok).toBe(false)
    })
  })

  describe('VOICE', () => {
    it('accepts audio within the 120s limit', () => {
      const result = parseBlockData(BlockType.VOICE, {
        audioUrl: 'https://cdn.example.com/a.mp3',
        duration: 90,
      })
      expect(result.ok).toBe(true)
    })

    it('rejects audio longer than 120s', () => {
      const result = parseBlockData(BlockType.VOICE, {
        audioUrl: 'https://cdn.example.com/a.mp3',
        duration: 121,
      })
      expect(result.ok).toBe(false)
    })

    it('rejects a non-URL audioUrl', () => {
      expect(parseBlockData(BlockType.VOICE, { audioUrl: 'not-a-url', duration: 10 }).ok).toBe(false)
    })
  })

  describe('IMAGE', () => {
    it('accepts a valid image URL', () => {
      const result = parseBlockData(BlockType.IMAGE, { url: 'https://cdn.example.com/i.png' })
      expect(result.ok).toBe(true)
    })

    it('accepts a null url (draft placeholder)', () => {
      expect(parseBlockData(BlockType.IMAGE, { url: null }).ok).toBe(true)
    })

    it('rejects a url without a scheme', () => {
      expect(parseBlockData(BlockType.IMAGE, { url: 'imagem-sem-protocolo.png' }).ok).toBe(false)
    })
  })

  describe('isExample stripping', () => {
    it('removes the isExample marker left by templates', () => {
      const result = parseBlockData(BlockType.FLASHCARD, {
        front: 'sigla',
        back: 'significado',
        isExample: true,
      })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.isExample).toBeUndefined()
        expect(result.data.front).toBe('sigla')
      }
    })
  })

  describe('FLASHCARD defaults', () => {
    it('fills empty front/back when omitted (permissive draft)', () => {
      const result = parseBlockData(BlockType.FLASHCARD, {})
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.front).toBe('')
        expect(result.data.back).toBe('')
      }
    })
  })
})
