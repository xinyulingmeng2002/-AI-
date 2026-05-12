// 作品管理 Store

import { create } from 'zustand'

export interface WorkspaceInfo {
  id: string
  title: string
  genre: string
  oneLiner: string
  coverPath: string
  status: string
  createdAt: string
  updatedAt: string
}

interface WorkspaceState {
  workspaces: WorkspaceInfo[]
  currentWorkspaceId: string | null
  loading: boolean

  loadWorkspaces: () => Promise<void>
  createWorkspace: (data: {
    title: string
    genre: string
    oneLiner: string
    coverPath?: string
  }) => Promise<string | null>
  updateWorkspace: (id: string, data: Partial<WorkspaceInfo>) => Promise<void>
  deleteWorkspace: (id: string) => Promise<void>
  setCurrentWorkspace: (id: string | null) => void
  getCurrentWorkspace: () => WorkspaceInfo | null
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  currentWorkspaceId: null,
  loading: false,

  loadWorkspaces: async () => {
    set({ loading: true })
    try {
      const result = await window.mindforge.workspace.list()
      if (result.success && result.data) {
        set({
          workspaces: result.data as WorkspaceInfo[],
          loading: false
        })
      }
    } catch {
      set({ loading: false })
    }
  },

  createWorkspace: async (data) => {
    try {
      const result = await window.mindforge.workspace.create({
        ...data,
        cover_path: data.coverPath ?? ''
      })
      if (result.success && result.id) {
        await get().loadWorkspaces()
        return result.id as string
      }
      return null
    } catch {
      return null
    }
  },

  updateWorkspace: async (id, data) => {
    const mapped: Record<string, unknown> = {}
    if (data.title !== undefined) mapped.title = data.title
    if (data.genre !== undefined) mapped.genre = data.genre
    if (data.oneLiner !== undefined) mapped.one_liner = data.oneLiner
    if (data.coverPath !== undefined) mapped.cover_path = data.coverPath
    if (data.status !== undefined) mapped.status = data.status

    await window.mindforge.workspace.update(id, mapped)
    await get().loadWorkspaces()
  },

  deleteWorkspace: async (id) => {
    await window.mindforge.workspace.delete(id)
    if (get().currentWorkspaceId === id) {
      set({ currentWorkspaceId: null })
    }
    await get().loadWorkspaces()
  },

  setCurrentWorkspace: (id) => set({ currentWorkspaceId: id }),

  getCurrentWorkspace: () => {
    const { workspaces, currentWorkspaceId } = get()
    return workspaces.find((w) => w.id === currentWorkspaceId) ?? null
  }
}))
