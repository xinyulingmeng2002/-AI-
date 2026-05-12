// OpenAI-compatible 适配器
// 适用于: OpenAI, DeepSeek, Zhipu GLM, Qwen, Moonshot, Ollama, 自定义兼容API

import type { ModelAdapter } from './adapter'
import type { ChatMessage, ChatOptions, ChatResponse, ChatChunk, ModelConfig } from './types'

export function createOpenAICompatibleAdapter(config: ModelConfig): ModelAdapter {
  const baseUrl = config.baseUrl.replace(/\/+$/, '')

  async function chat(
    messages: ChatMessage[],
    options: ChatOptions
  ): Promise<ChatResponse> {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: options.model || config.name,
        messages,
        temperature: options.temperature ?? config.temperature,
        max_tokens: options.maxTokens ?? config.maxTokens,
        top_p: options.topP ?? config.topP,
        stream: false
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    return {
      content: data.choices[0]?.message?.content ?? '',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      } : undefined
    }
  }

  async function* streamChat(
    messages: ChatMessage[],
    options: ChatOptions
  ): AsyncGenerator<ChatChunk> {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: options.model || config.name,
        messages,
        temperature: options.temperature ?? config.temperature,
        max_tokens: options.maxTokens ?? config.maxTokens,
        top_p: options.topP ?? config.topP,
        stream: true
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API error (${response.status}): ${errorText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('Response body is not readable')

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? '' // 保留未完成的行

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue

          const data = trimmed.slice(6)
          if (data === '[DONE]') {
            yield { content: '', done: true }
            return
          }

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices[0]?.delta?.content ?? ''
            if (content) {
              yield { content, done: false }
            }
          } catch {
            // 忽略解析失败的行
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    yield { content: '', done: true }
  }

  async function listModels(apiKey: string, url: string): Promise<string[]> {
    const base = url.replace(/\/+$/, '')
    const response = await fetch(`${base}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    })

    if (!response.ok) return []

    const data = await response.json()
    return (data.data ?? []).map((m: { id: string }) => m.id).sort()
  }

  return {
    provider: config.provider,
    supportsStreaming: true,
    maxContextLength: getMaxContextLength(config.name),
    chat,
    streamChat,
    listModels
  }
}

function getMaxContextLength(modelName: string): number {
  const name = modelName.toLowerCase()
  if (name.includes('gpt-4o')) return 128000
  if (name.includes('gpt-4-turbo')) return 128000
  if (name.includes('gpt-4')) return 8192
  if (name.includes('gpt-3.5')) return 16385
  if (name.includes('claude-3-opus')) return 200000
  if (name.includes('claude-3.5-sonnet')) return 200000
  if (name.includes('deepseek-v3')) return 65536
  if (name.includes('deepseek-r1')) return 65536
  if (name.includes('glm-4')) return 131072
  if (name.includes('qwen')) return 131072
  // 默认值
  return 65536
}
