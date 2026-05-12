// 大纲/章纲要 Store

import { create } from 'zustand'
import type { ChapterOutline, VolumeOutline, SceneBeat, ForeshadowingOp } from '@mindforge/shared'

export interface VolumeNode {
  id: string
  volumeNumber: number
  title: string
  summary: string
  chapters: ChapterNode[]
  expanded: boolean
}

export interface ChapterNode {
  id: string
  chapterNumber: number
  volumeNumber: number
  title: string
  outline: ChapterOutline | null
  wordCount: number
  status: 'draft' | 'locked' | 'in_progress' | 'completed'
}

interface OutlineState {
  volumes: VolumeNode[]
  activeChapterId: string | null
  editingOutlineId: string | null  // 正在编辑纲的章节ID
  loading: boolean

  // Volume operations
  addVolume: (title: string) => void
  removeVolume: (volumeId: string) => void
  toggleVolumeExpanded: (volumeId: string) => void
  reorderVolumes: (fromIndex: number, toIndex: number) => void

  // Chapter operations
  addChapter: (volumeId: string, title: string) => string
  removeChapter: (chapterId: string) => void
  reorderChapters: (volumeId: string, fromIndex: number, toIndex: number) => void

  // Outline editing
  setActiveChapter: (chapterId: string | null) => void
  openOutlineEditor: (chapterId: string) => void
  closeOutlineEditor: () => void
  updateChapterOutline: (chapterId: string, outline: Partial<ChapterOutline>) => void
  updateChapterWordCount: (chapterId: string, count: number) => void
}

let idCounter = 0
function genId(prefix: string) {
  idCounter++
  return `${prefix}_${Date.now()}_${idCounter}`
}

export function createDefaultChapterOutline(
  chapterId: string,
  volumeId: string,
  chapterNumber: number,
  title: string
): ChapterOutline {
  return {
    chapterId,
    volumeId,
    chapterNumber,
    title,
    objective: {
      mainlineProgress: '',
      subplotProgress: []
    },
    coreConflict: {
      type: 'character_vs_character',
      description: '',
      intensity: 3
    },
    characters: [],
    sceneBeats: [],
    foreshadowing: {
      planted: [],
      recovered: []
    },
    targetWordCount: 3000,
    emotionalCurve: [],
    endingHook: '',
    status: 'draft',
    source: 'user',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

export const useOutlineStore = create<OutlineState>((set, get) => ({
  volumes: [],
  activeChapterId: null,
  editingOutlineId: null,
  loading: false,

  addVolume: (title) => {
    const vol: VolumeNode = {
      id: genId('vol'),
      volumeNumber: get().volumes.length + 1,
      title,
      summary: '',
      chapters: [],
      expanded: true
    }
    set((s) => ({ volumes: [...s.volumes, vol] }))
  },

  removeVolume: (volumeId) => {
    set((s) => ({
      volumes: s.volumes
        .filter((v) => v.id !== volumeId)
        .map((v, i) => ({ ...v, volumeNumber: i + 1 }))
    }))
  },

  toggleVolumeExpanded: (volumeId) => {
    set((s) => ({
      volumes: s.volumes.map((v) =>
        v.id === volumeId ? { ...v, expanded: !v.expanded } : v
      )
    }))
  },

  reorderVolumes: (from, to) => {
    set((s) => {
      const vols = [...s.volumes]
      const [moved] = vols.splice(from, 1)
      vols.splice(to, 0, moved)
      return {
        volumes: vols.map((v, i) => ({ ...v, volumeNumber: i + 1 }))
      }
    })
  },

  addChapter: (volumeId, title) => {
    const id = genId('ch')
    set((s) => ({
      volumes: s.volumes.map((v) => {
        if (v.id !== volumeId) return v
        const chapterNumber = v.chapters.length + 1
        const chapter: ChapterNode = {
          id,
          chapterNumber,
          volumeNumber: v.volumeNumber,
          title,
          outline: createDefaultChapterOutline(id, volumeId, chapterNumber, title),
          wordCount: 0,
          status: 'draft'
        }
        return { ...v, chapters: [...v.chapters, chapter] }
      })
    }))
    return id
  },

  removeChapter: (chapterId) => {
    set((s) => ({
      volumes: s.volumes.map((v) => ({
        ...v,
        chapters: v.chapters
          .filter((c) => c.id !== chapterId)
          .map((c, i) => ({ ...c, chapterNumber: i + 1 }))
      })),
      activeChapterId: s.activeChapterId === chapterId ? null : s.activeChapterId,
      editingOutlineId: s.editingOutlineId === chapterId ? null : s.editingOutlineId
    }))
  },

  reorderChapters: (volumeId, from, to) => {
    set((s) => ({
      volumes: s.volumes.map((v) => {
        if (v.id !== volumeId) return v
        const chs = [...v.chapters]
        const [moved] = chs.splice(from, 1)
        chs.splice(to, 0, moved)
        return {
          ...v,
          chapters: chs.map((c, i) => ({ ...c, chapterNumber: i + 1 }))
        }
      })
    }))
  },

  setActiveChapter: (id) => set({ activeChapterId: id }),
  openOutlineEditor: (id) => set({ editingOutlineId: id }),
  closeOutlineEditor: () => set({ editingOutlineId: null }),

  updateChapterOutline: (chapterId, partial) => {
    set((s) => ({
      volumes: s.volumes.map((v) => ({
        ...v,
        chapters: v.chapters.map((c) =>
          c.id === chapterId && c.outline
            ? {
                ...c,
                outline: {
                  ...c.outline,
                  ...partial,
                  updatedAt: new Date().toISOString(),
                  version: c.outline.version + 1
                }
              }
            : c
        )
      }))
    }))
  },

  updateChapterWordCount: (chapterId, count) => {
    set((s) => ({
      volumes: s.volumes.map((v) => ({
        ...v,
        chapters: v.chapters.map((c) =>
          c.id === chapterId ? { ...c, wordCount: count } : c
        )
      }))
    }))
  }
}))
