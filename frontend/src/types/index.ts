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
