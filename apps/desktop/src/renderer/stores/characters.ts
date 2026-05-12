// 人物档案 Store

import { create } from 'zustand'
import type { Character, Trait, CharacterAbility, Relationship } from '@mindforge/shared'

interface CharacterState {
  characters: Character[]
  editingId: string | null

  loadFromDb: (workspaceId: string) => Promise<void>
  addCharacter: (name: string) => string
  removeCharacter: (id: string) => void
  updateCharacter: (id: string, partial: Partial<Character>) => void
  setEditing: (id: string | null) => void
}

let charCounter = 0
function genCharId() {
  charCounter++
  return `char_${Date.now()}_${charCounter}`
}

export function createDefaultCharacter(name: string): Character {
  return {
    id: genCharId(),
    name,
    aliases: [],
    archetype: '',
    personality: {
      traits: [],
      mbti: null,
      motivation: '',
      fear: '',
      flaw: ''
    },
    background: '',
    appearance: '',
    speechStyle: '',
    abilities: [],
    relationships: [],
    arc: {
      stage: 'introduction',
      progress: 0,
      nextMilestone: ''
    },
    currentState: {
      location: '',
      status: 'alive',
      emotionalState: '',
      lastAppearedChapter: null
    }
  }
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  characters: [],
  editingId: null,

  // 从数据库加载角色
  loadFromDb: async (workspaceId: string) => {
    try {
      const result = await window.mindforge.db.getAll('characters', workspaceId)
      if (result.success && result.data) {
        const chars = (result.data as Record<string, unknown>[]).map((r) => {
          const data = JSON.parse((r.data_json as string) || '{}')
          return { ...data, id: r.id as string, name: r.name as string } as Character
        })
        set({ characters: chars })
      }
    } catch { /* ignore */ }
  },

  addCharacter: (name) => {
    const char = createDefaultCharacter(name)
    set((s) => ({ characters: [...s.characters, char] }))
    return char.id
  },

  removeCharacter: (id) => {
    set((s) => ({
      characters: s.characters.filter((c) => c.id !== id),
      editingId: s.editingId === id ? null : s.editingId
    }))
    window.mindforge.db.delete('characters', id).catch(() => {})
  },

  updateCharacter: (id, partial) => {
    set((s) => ({
      characters: s.characters.map((c) =>
        c.id === id ? { ...c, ...partial } : c
      )
    }))
    // 同步到DB
    const updated = get().characters.find((c) => c.id === id)
    if (updated) {
      window.mindforge.db.update('characters', id, {
        name: updated.name,
        data_json: JSON.stringify(updated)
      }).catch(() => {})
    }
  },

  setEditing: (id) => set({ editingId: id })
}))
