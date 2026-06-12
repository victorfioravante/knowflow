import { create } from 'zustand'

interface PlayerState {
  lastPlayedDeckId: string | null
  setLastPlayedDeckId: (id: string | null) => void
}

export const usePlayerStore = create<PlayerState>((set) => ({
  lastPlayedDeckId: null,
  setLastPlayedDeckId: (lastPlayedDeckId) => set({ lastPlayedDeckId }),
}))
