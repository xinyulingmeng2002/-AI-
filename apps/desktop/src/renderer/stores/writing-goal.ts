// 每日写作目标 Store

import { create } from 'zustand'

interface WritingGoalState {
  dailyGoal: number       // 每日目标字数
  todayWritten: number    // 今日已写字数
  goalMet: boolean

  setDailyGoal: (goal: number) => void
  setTodayWritten: (count: number) => void
  getProgress: () => number // 0-100
}

const STORAGE_KEY = 'mindforge_writing_goal'

function loadGoal(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? parseInt(stored, 10) : 4000
  } catch { return 4000 }
}

function saveGoal(goal: number) {
  try { localStorage.setItem(STORAGE_KEY, String(goal)) } catch { /* noop */ }
}

export const useWritingGoalStore = create<WritingGoalState>((set, get) => ({
  dailyGoal: loadGoal(),
  todayWritten: 0,
  goalMet: false,

  setDailyGoal: (goal) => {
    set({ dailyGoal: goal, goalMet: get().todayWritten >= goal })
    saveGoal(goal)
  },

  setTodayWritten: (count) => {
    const { dailyGoal } = get()
    set({ todayWritten: count, goalMet: count >= dailyGoal })
  },

  getProgress: () => {
    const { todayWritten, dailyGoal } = get()
    return dailyGoal > 0 ? Math.min(100, Math.round((todayWritten / dailyGoal) * 100)) : 0
  }
}))
