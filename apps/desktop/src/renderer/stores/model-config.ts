import { create } from 'zustand'
import type { ModelConfig, ModelProvider, TaskType } from '@mindforge/core'

export interface ModelConfigEntry {
  id: string
  provider: ModelProvider
  providerName: string
  modelName: string
  apiKey: string
  baseUrl: string
  temperature: number
  maxTokens: number
  topP: number
  isDefault: boolean
}

interface ModelConfigState {
  // 所有已配置的模型
  models: ModelConfigEntry[]
  // 全局默认模型ID
  defaultModelId: string
  // 任务级模型映射 (taskType -> modelId, null表示跟随默认)
  taskMappings: Record<TaskType, string | null>
  // 测试连接状态
  testingConnection: boolean
  testResult: string | null

  // 操作
  addModel: (config: Omit<ModelConfigEntry, 'id' | 'isDefault'>) => void
  removeModel: (id: string) => void
  updateModel: (id: string, partial: Partial<ModelConfigEntry>) => void
  setDefaultModel: (id: string) => void
  setTaskMapping: (taskType: TaskType, modelId: string | null) => void
  testConnection: (id: string) => Promise<void>
  toCoreConfigs: () => ModelConfig[]
}

// 生成简短ID
function generateId(): string {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

function savePersist(state: Partial<ModelConfigState>) {
  try { localStorage.setItem('mindforge_models', JSON.stringify({ models: state.models, defaultModelId: state.defaultModelId, taskMappings: state.taskMappings })) } catch { /* ignore */ }
}

function loadPersist(): { models: ModelConfigEntry[]; defaultModelId: string; taskMappings: Record<string, string | null> } | null {
  try {
    const raw = localStorage.getItem('mindforge_models')
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

const saved = loadPersist()

export const useModelConfigStore = create<ModelConfigState>((set, get) => ({
  models: saved?.models ?? [],
  defaultModelId: saved?.defaultModelId ?? '',
  taskMappings: (saved?.taskMappings as Record<string, string | null>) ?? {
    chat: null,
    outline: null,
    draft: null,
    audit: null,
    extract: null
  },
  testingConnection: false,
  testResult: null,

  addModel: (config) => {
    const id = generateId()
    const entry: ModelConfigEntry = {
      ...config,
      id,
      isDefault: get().models.length === 0 // 第一个模型自动设为默认
    }
    set((s) => {
      const newState = { models: [...s.models, entry], defaultModelId: s.defaultModelId || id }
      savePersist(newState)
      return newState
    })
  },

  removeModel: (id) => {
    set((s) => {
      const filtered = s.models.filter((m) => m.id !== id)
      return {
        models: filtered,
        defaultModelId: s.defaultModelId === id
          ? (filtered[0]?.id ?? '')
          : s.defaultModelId,
        taskMappings: Object.fromEntries(
          Object.entries(s.taskMappings).map(([task, modelId]) =>
            [task, modelId === id ? null : modelId]
          )
        ) as Record<TaskType, string | null>
      }
    })
  },

  updateModel: (id, partial) => {
    set((s) => ({
      models: s.models.map((m) =>
        m.id === id ? { ...m, ...partial } : m
      )
    }))
  },

  setDefaultModel: (id) => set((s) => { savePersist({ ...s, defaultModelId: id }); return { defaultModelId: id } }),

  setTaskMapping: (taskType, modelId) => {
    set((s) => {
      const newMappings = { ...s.taskMappings, [taskType]: modelId }
      savePersist({ ...s, taskMappings: newMappings })
      return { taskMappings: newMappings }
    })
  },

  testConnection: async (id) => {
    set({ testingConnection: true, testResult: null })
    try {
      const model = get().models.find((m) => m.id === id)
      if (!model) throw new Error('Model not found')

      const response = await fetch(`${model.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${model.apiKey}`
        },
        body: JSON.stringify({
          model: model.modelName,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 5
        })
      })

      if (response.ok) {
        set({ testResult: `[通过] 连接成功 — ${model.providerName} / ${model.modelName}` })
      } else {
        const err = await response.text()
        set({ testResult: `[失败] 连接失败 (${response.status}): ${err.slice(0, 100)}` })
      }
    } catch (e) {
      set({ testResult: `[失败] 连接失败: ${(e as Error).message}` })
    } finally {
      set({ testingConnection: false })
    }
  },

  toCoreConfigs: () => {
    return get().models.map((m) => ({
      id: m.id,
      provider: m.provider,
      name: m.modelName,
      apiKey: m.apiKey,
      baseUrl: m.baseUrl,
      temperature: m.temperature,
      maxTokens: m.maxTokens,
      topP: m.topP
    }))
  }
}))
