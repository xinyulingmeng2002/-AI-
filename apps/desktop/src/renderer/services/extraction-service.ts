// 要素提取服务 — 桥接核心提取器与 UI 层

import { createExtractor, type ExtractionResult, type ExtractionCard } from '@mindforge/core'
import { sendChatMessage } from './chat-service'

// 内存中的设定摘要缓存（后续迁移到 Truth Files）
let existingSummary = ''

export function updateExistingSummary(summary: string) {
  existingSummary = summary
}

const extractor = createExtractor({
  callLLM: async (messages) => {
    let fullResponse = ''
    await sendChatMessage(messages as never, {
      onToken: () => {},
      onDone: (content) => { fullResponse = content },
      onError: (e) => { throw e }
    })
    return fullResponse
  },
  getExistingSummary: () => existingSummary
})

export interface ExtractionCallbacks {
  onCardGenerated: (card: ExtractionCard) => void
  onNoExtraction: () => void
}

export async function tryExtract(
  userMessage: string,
  callbacks: ExtractionCallbacks
): Promise<void> {
  if (!extractor.shouldExtract(userMessage)) {
    callbacks.onNoExtraction()
    return
  }

  // 使用专门的 extract task type 调用 LLM
  // 这里用非流式调用以获得完整的 JSON 响应
  const { createRouter } = await import('@mindforge/core')
  const { useModelConfigStore } = await import('@/stores/model-config')

  const store = useModelConfigStore.getState()
  const configs = store.toCoreConfigs()
  const defaultId = store.defaultModelId

  if (configs.length === 0) {
    callbacks.onNoExtraction()
    return
  }

  const router = createRouter(configs, defaultId)

  try {
    const response = await router.chat('extract', [
      { role: 'system', content: '你是一位专业的网文创作要素分析师。' },
      { role: 'user', content: userMessage }
    ])

    // 使用提取器解析结果
    const result = extractor.toExtractionCard(await extractor.extract(userMessage) ?? {
      intent: 'chat',
      entities: [],
      relations: [],
      summary: ''
    })

    if (result.entities.length > 0) {
      callbacks.onCardGenerated(result)
      // 更新设定摘要
      existingSummary += `\n${result.summary}`
    } else {
      callbacks.onNoExtraction()
    }
  } catch {
    callbacks.onNoExtraction()
  }
}
