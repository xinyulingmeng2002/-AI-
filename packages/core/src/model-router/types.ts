// 模型路由层类型定义

export type ModelProvider =
  | 'openai'
  | 'anthropic'
  | 'deepseek'
  | 'zhipu'
  | 'qwen'
  | 'moonshot'
  | 'ollama'
  | 'custom'

export type TaskType =
  | 'chat'        // 中枢对话 — 创意型
  | 'outline'     // 纲要生成 — 平衡型
  | 'draft'       // 正文续写 — 创意型
  | 'audit'       // 一致性审核 — 分析型
  | 'extract'     // 要素提取 — 分析型

export interface ModelConfig {
  id: string
  provider: ModelProvider
  name: string          // 模型名称，如 gpt-4o, claude-sonnet-4-6
  apiKey: string
  baseUrl: string       // API endpoint
  temperature: number
  maxTokens: number
  topP: number
}

export interface TaskModelMapping {
  taskType: TaskType
  modelConfigId: string | null  // null = 跟随全局默认
}

export interface GlobalModelSettings {
  defaultModelId: string
  taskMappings: TaskModelMapping[]
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatOptions {
  model: string
  temperature?: number
  maxTokens?: number
  topP?: number
  systemPrompt?: string
}

export interface ChatResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

// 流式响应块
export interface ChatChunk {
  content: string
  done: boolean
}

// 任务级推荐参数
export const TASK_DEFAULTS: Record<TaskType, { temperature: number; description: string }> = {
  chat:    { temperature: 0.8, description: '中枢对话 — 创意表达' },
  outline: { temperature: 0.5, description: '纲要生成 — 结构严谨' },
  draft:   { temperature: 0.75, description: '正文续写 — 文笔流畅' },
  audit:   { temperature: 0.2, description: '一致性审核 — 分析严谨' },
  extract: { temperature: 0.1, description: '要素提取 — 精准匹配' }
}
