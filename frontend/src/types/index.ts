// Types globais TypeScript

export type UserRole = 'ADMIN' | 'MANAGER' | 'CONTRIBUTOR' | 'LEARNER'
export type DeckStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED'
export type BlockType = 'TEXT' | 'IMAGE' | 'VOICE' | 'FLASHCARD' | 'QUIZ'
export type ReviewRating = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY'

export interface Organization {
  id: string
  name: string
  slug: string
  logoUrl: string | null
}

export interface Sector {
  id: string
  name: string
  _count?: { users: number }
}

export interface JobRole {
  id: string
  name: string
  _count?: { users: number }
}

export interface KnowledgeArea {
  id: string
  name: string
  color: string
  icon: string | null
  _count?: { decks: number }
}

// ─── Conteúdo ──────────────────────────────────────────────

export interface TextBlockData {
  content: unknown // TipTap JSON
  isExample?: boolean
}

export interface ImageBlockData {
  url: string | null
  alt?: string
  isExample?: boolean
}

export interface VoiceBlockData {
  audioUrl: string | null
  duration: number
  transcript?: string
  isExample?: boolean
}

export interface FlashcardBlockData {
  front: string
  back: string
  frontImageUrl?: string | null
  isExample?: boolean
}

export interface QuizBlockData {
  question: string
  options: string[]
  correctIndex: number
  explanation?: string
  isExample?: boolean
}

export type BlockData =
  | TextBlockData
  | ImageBlockData
  | VoiceBlockData
  | FlashcardBlockData
  | QuizBlockData

export interface Block {
  id: string
  storyId: string
  type: BlockType
  order: number
  data: BlockData
}

export interface Story {
  id: string
  deckId: string
  order: number
  blocks: Block[]
}

export interface Deck {
  id: string
  title: string
  description: string | null
  coverColor: string
  status: DeckStatus
  sectorId: string | null
  knowledgeAreaId: string | null
  createdById: string
  rejectionNote: string | null
  updatedAt: string
  knowledgeArea?: Pick<KnowledgeArea, 'id' | 'name' | 'color'> | null
  sector?: Pick<Sector, 'id' | 'name'> | null
  createdBy?: { id: string; name: string; avatarUrl: string | null }
  stories?: Story[]
  _count?: { stories: number }
  progress?: DeckProgress | null
}

export interface DeckProgress {
  id: string
  userId: string
  deckId: string
  completedAt: string | null
  score: number | null
}

export interface Template {
  id: string
  name: string
  description: string | null
  source: 'PLATFORM' | 'ORGANIZATION'
  structure: Array<{
    order: number
    blocks: Array<{ type: BlockType; order: number; data: Record<string, unknown> }>
  }>
}

export interface User {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  role: UserRole
  sectorId: string | null
  roleId: string | null
  sector?: Pick<Sector, 'id' | 'name'> | null
  jobRole?: Pick<JobRole, 'id' | 'name'> | null
  organization?: Organization
}
