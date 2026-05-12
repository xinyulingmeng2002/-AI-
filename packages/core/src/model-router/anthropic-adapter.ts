// Anthropic (Claude) 适配器

import type { ModelAdapter } from './adapter'
import type { ChatMessage, ChatOptions, ChatResponse, ChatChunk, ModelConfig } from './types'

export function createAnthropicAdapter(config: ModelConfig): ModelAdapter {
  const baseUrl = config.baseUrl.replace(/\/+$/, '')

  // Anthropic API 使用不同的消息格式，需要转换
  function toAnthropicMessages(messages: ChatMessage[]) {
    // 提取 system 消息
    const systemMsg = messages.find(m => m.role === 'system')
    const chatMessages = messages.filter(m => m.role !== 'system')

    return {
      system: systemMsg?.content,
      messages: chatMessages.map(m => ({
        role: m.role,
        content: m.content
      }))
    }
  }

  async function chat(
    messages: ChatMessage[],
    options: ChatOptions
  ): Promise<ChatResponse> {
    const { system, messages: anthMessages } = toAnthropicMessages(messages)

    const body: Record<string, unknown> = {
      model: options.model || config.name,
      max_tokens: options.maxTokens ?? config.maxTokens,
      messages: anthMessages
    }

    if (system || options.systemPrompt) {
      body.system = options.systemPrompt || system
    }

    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Anthropic API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    return {
      content: data.content?.[0]?.text ?? '',
      usage: data.usage ? {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens
      } : undefined
    }
  }

  async function* streamChat(
    messages: ChatMessage[],
    options: ChatOptions
  ): AsyncGenerator<ChatChunk> {
    const { system, messages: anthMessages } = toAnthropicMessages(messages)

    const body: Record<string, unknown> = {
      model: options.model || config.name,
      max_tokens: options.maxTokens ?? config.maxTokens,
      messages: anthMessages,
      stream: true
    }

    if (system || options.systemPrompt) {
      body.system = options.systemPrompt || system
    }

    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Anthropic API error (${response.status}): ${errorText}`)
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
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue

          const data = trimmed.slice(6)
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'content_block_delta') {
              const text = parsed.delta?.text ?? ''
              if (text) yield { content: text, done: false }
            } else if (parsed.type === 'message_stop') {
              yield { content: '', done: true }
              return
            }
          } catch {
            // 忽略解析失败
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    yield { content: '', done: true }
  }

  async function listModels(_apiKey: string, _url: string): Promise<string[]> {
    // Anthropic 没有公开的 /models 端点，返回已知模型列表
    return [
      'claude-opus-4-7',
      'claude-sonnet-4-6',
      'claude-haiku-4-5',
      'claude-3.5-sonnet',
      'claude-3-opus'
    ]
  }

  return {
    provider: 'anthropic',
    supportsStreaming: true,
    maxContextLength: 200000,
    chat,
    streamChat,
    listModels
  }
}
