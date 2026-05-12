// 主流模型 Provider 预设配置

import type { ModelProvider } from './types'

export interface ProviderPreset {
  provider: ModelProvider
  name: string
  defaultBaseUrl: string
  defaultModels: string[]
  requiresApiKey: boolean
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    provider: 'openai',
    name: 'OpenAI',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModels: ['gpt-4o', 'gpt-4-turbo', 'gpt-4o-mini', 'gpt-3.5-turbo'],
    requiresApiKey: true
  },
  {
    provider: 'anthropic',
    name: 'Anthropic',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    defaultModels: ['claude-sonnet-4-6', 'claude-haiku-4-5', 'claude-3.5-sonnet', 'claude-3-opus'],
    requiresApiKey: true
  },
  {
    provider: 'deepseek',
    name: 'DeepSeek',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    defaultModels: ['deepseek-chat', 'deepseek-reasoner'],
    requiresApiKey: true
  },
  {
    provider: 'zhipu',
    name: '智谱 GLM',
    defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModels: ['glm-4-plus', 'glm-4', 'glm-4-flash'],
    requiresApiKey: true
  },
  {
    provider: 'qwen',
    name: '通义千问',
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModels: ['qwen-max', 'qwen-plus', 'qwen-turbo'],
    requiresApiKey: true
  },
  {
    provider: 'moonshot',
    name: '月之暗面 Kimi',
    defaultBaseUrl: 'https://api.moonshot.cn/v1',
    defaultModels: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    requiresApiKey: true
  },
  {
    provider: 'ollama',
    name: 'Ollama (本地)',
    defaultBaseUrl: 'http://localhost:11434/v1',
    defaultModels: ['llama3', 'qwen2.5', 'deepseek-coder'],
    requiresApiKey: false
  },
  {
    provider: 'custom',
    name: '自定义 API',
    defaultBaseUrl: 'https://your-api-endpoint.com/v1',
    defaultModels: [],
    requiresApiKey: true
  }
]

export function getProviderPreset(provider: ModelProvider): ProviderPreset | undefined {
  return PROVIDER_PRESETS.find(p => p.provider === provider)
}
