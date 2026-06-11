// Estado do CanvasEditor
import { create } from 'zustand'

interface EditorState {
  selectedStoryId: string | null
  previewOpen: boolean
  saving: boolean
  selectStory: (storyId: string | null) => void
  setPreviewOpen: (open: boolean) => void
  setSaving: (saving: boolean) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  selectedStoryId: null,
  previewOpen: false,
  saving: false,
  selectStory: (selectedStoryId) => set({ selectedStoryId }),
  setPreviewOpen: (previewOpen) => set({ previewOpen }),
  setSaving: (saving) => set({ saving }),
}))
