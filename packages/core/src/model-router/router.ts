// 任务级模型路由器

import type { ModelAdapter } from './adapter'
import { createAdapter } from './adapter'
import type { ModelConfig, TaskType, ChatMessage, ChatOptions, ChatResponse, ChatChunk } from './types'
import { TASK_DEFAULTS } from './types'

export interface RouterConfig {
  models: Map<string, ModelConfig>      // id -> config
  defaultModelId: string
  taskMappings: Map<TaskType, string | null>  // taskType -> modelConfigId (null = 跟随默认)
}

export class ModelRouter {
  private adapters: Map<string, ModelAdapter> = new Map()
  private config: RouterConfig

  constructor(config: RouterConfig) {
    this.config = config
  }

  /** 获取或创建适配器实例 */
  private getAdapter(modelConfigId: string): ModelAdapter {
    let adapter = this.adapters.get(modelConfigId)
    if (!adapter) {
      const modelConfig = this.config.models.get(modelConfigId)
      if (!modelConfig) {
        throw new Error(`Model config not found: ${modelConfigId}`)
      }
      adapter = createAdapter(modelConfig)
      this.adapters.set(modelConfigId, adapter)
    }
    return adapter
  }

  /** 解析任务对应的模型配置ID */
  private resolveModelId(taskType: TaskType): string {
    const mapping = this.config.taskMappings.get(taskType)
    if (mapping && this.config.models.has(mapping)) {
      return mapping
    }
    return this.config.defaultModelId
  }

  /** 执行聊天（非流式） */
  async chat(
    taskType: TaskType,
    messages: ChatMessage[],
    options?: Partial<ChatOptions>
  ): Promise<ChatResponse> {
    const modelId = this.resolveModelId(taskType)
    const adapter = this.getAdapter(modelId)
    const defaults = TASK_DEFAULTS[taskType]

    return adapter.chat(messages, {
      model: this.config.models.get(modelId)!.name,
      temperature: defaults.temperature,
      maxTokens: 4096,
      ...options
    })
  }

  /** 执行聊天（流式） */
  async *streamChat(
    taskType: TaskType,
    messages: ChatMessage[],
    options?: Partial<ChatOptions>
  ): AsyncGenerator<ChatChunk> {
    const modelId = this.resolveModelId(taskType)
    const adapter = this.getAdapter(modelId)
    const defaults = TASK_DEFAULTS[taskType]

    yield* adapter.streamChat(messages, {
      model: this.config.models.get(modelId)!.name,
      temperature: defaults.temperature,
      maxTokens: 4096,
      ...options
    })
  }

  /** 更新路由配置 */
  updateConfig(partial: Partial<RouterConfig>) {
    if (partial.models) this.config.models = partial.models
    if (partial.defaultModelId) this.config.defaultModelId = partial.defaultModelId
    if (partial.taskMappings) this.config.taskMappings = partial.taskMappings
    // 清除缓存的适配器，下次调用时重建
    this.adapters.clear()
  }

  /** 获取当前配置 */
  getConfig(): Readonly<RouterConfig> {
    return this.config
  }
}

/** 创建路由器实例 */
export function createRouter(configs: ModelConfig[], defaultModelId: string): ModelRouter {
  const models = new Map<string, ModelConfig>()
  for (const c of configs) {
    models.set(c.id, c)
  }

  const taskMappings = new Map<TaskType, string | null>()
  // 默认所有任务跟随全局模型
  for (const taskType of ['chat', 'outline', 'draft', 'audit', 'extract'] as TaskType[]) {
    taskMappings.set(taskType, null)
  }

  return new ModelRouter({ models, defaultModelId, taskMappings })
}
