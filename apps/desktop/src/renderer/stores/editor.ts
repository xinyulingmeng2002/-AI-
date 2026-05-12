import { create } from 'zustand'

interface EditorState {
  wordCount: number
  isDirty: boolean
  currentChapter: string
  setWordCount: (count: number) => void
  setIsDirty: (dirty: boolean) => void
  setSaved: () => void
  setCurrentChapter: (title: string) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  wordCount: 0,
  isDirty: false,
  currentChapter: '第1章',

  setWordCount: (count) => set({ wordCount: count }),
  setIsDirty: (dirty) => set({ isDirty: dirty }),
  setSaved: () => set({ isDirty: false }),
  setCurrentChapter: (title) => set({ currentChapter: title })
}))
