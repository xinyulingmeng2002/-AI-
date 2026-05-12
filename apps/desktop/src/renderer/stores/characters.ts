// 人物档案 Store

import { create } from 'zustand'
import type { Character, Trait, CharacterAbility, Relationship } from '@mindforge/shared'

interface CharacterState {
  characters: Character[]
  editingId: string | null

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
  },

  updateCharacter: (id, partial) => {
    set((s) => ({
      characters: s.characters.map((c) =>
        c.id === id ? { ...c, ...partial } : c
      )
    }))
  },

  setEditing: (id) => set({ editingId: id })
}))
