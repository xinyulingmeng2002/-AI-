// 通用模型适配器接口

import type { ChatMessage, ChatOptions, ChatResponse, ChatChunk, ModelConfig } from './types'

export interface ModelAdapter {
  readonly provider: string
  readonly supportsStreaming: boolean
  readonly maxContextLength: number

  /** 发送聊天请求（非流式） */
  chat(messages: ChatMessage[], options: ChatOptions): Promise<ChatResponse>

  /** 发送聊天请求（流式），返回异步生成器 */
  streamChat(messages: ChatMessage[], options: ChatOptions): AsyncGenerator<ChatChunk>

  /** 获取此 Provider 可用的模型列表 */
  listModels(apiKey: string, baseUrl: string): Promise<string[]>
}

export function createAdapter(config: ModelConfig): ModelAdapter {
  // 所有 OpenAI-compatible 的 Provider 都用同一个适配器
  // Anthropic 和特殊格式的 Provider 需要独立适配器
  switch (config.provider) {
    case 'anthropic':
      return createAnthropicAdapter(config)
    default:
      // OpenAI / DeepSeek / Zhipu / Qwen / Moonshot / Ollama / custom
      // 都兼容 OpenAI chat completions 格式
      return createOpenAICompatibleAdapter(config)
  }
}

// 延迟导入以避免循环依赖
import { createOpenAICompatibleAdapter } from './openai-adapter'
import { createAnthropicAdapter } from './anthropic-adapter'
