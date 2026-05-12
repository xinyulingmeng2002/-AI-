import { create } from 'zustand'

export type BottomPanelTab = 'characters' | 'world' | 'hooks' | 'outline-compare' | 'namegen' | 'timeline' | 'relations'

interface WorkbenchState {
  // 面板显示状态
  leftPanelVisible: boolean
  rightPanelVisible: boolean
  bottomPanelVisible: boolean
  bottomPanelTab: BottomPanelTab

  // 面板宽度 (0-1 比例)
  leftPanelRatio: number
  rightPanelRatio: number
  bottomPanelRatio: number

  // 操作
  toggleLeftPanel: () => void
  toggleRightPanel: () => void
  toggleBottomPanel: () => void
  setBottomPanelTab: (tab: BottomPanelTab) => void
  setLeftPanelRatio: (ratio: number) => void
  setRightPanelRatio: (ratio: number) => void
  setBottomPanelRatio: (ratio: number) => void
}

export const useWorkbenchStore = create<WorkbenchState>((set) => ({
  leftPanelVisible: true,
  rightPanelVisible: true,
  bottomPanelVisible: true,
  bottomPanelTab: 'characters',

  leftPanelRatio: 0.18,
  rightPanelRatio: 0.28,
  bottomPanelRatio: 0.22,

  toggleLeftPanel: () => set((s) => ({ leftPanelVisible: !s.leftPanelVisible })),
  toggleRightPanel: () => set((s) => ({ rightPanelVisible: !s.rightPanelVisible })),
  toggleBottomPanel: () => set((s) => ({ bottomPanelVisible: !s.bottomPanelVisible })),
  setBottomPanelTab: (tab) => set({ bottomPanelTab: tab }),

  setLeftPanelRatio: (ratio) => set({ leftPanelRatio: Math.max(0.1, Math.min(0.35, ratio)) }),
  setRightPanelRatio: (ratio) => set({ rightPanelRatio: Math.max(0.2, Math.min(0.45, ratio)) }),
  setBottomPanelRatio: (ratio) => set({ bottomPanelRatio: Math.max(0.12, Math.min(0.4, ratio)) })
}))
