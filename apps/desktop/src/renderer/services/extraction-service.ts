// 要素提取服务

import { createRouter, type ExtractionCard, EXTRACTION_SYSTEM_PROMPT } from '@mindforge/core'
import { useModelConfigStore } from '@/stores/model-config'

let existingSummary = ''

export function updateExistingSummary(summary: string) {
  existingSummary = summary
}

export interface ExtractionCallbacks {
  onCardGenerated: (card: ExtractionCard) => void
  onNoExtraction: () => void
}

export async function tryExtract(
  userMessage: string,
  callbacks: ExtractionCallbacks
): Promise<void> {
  const store = useModelConfigStore.getState()
  const configs = store.toCoreConfigs()
  if (configs.length === 0) {
    callbacks.onNoExtraction()
    return
  }

  const router = createRouter(configs, store.defaultModelId)

  try {
    const response = await router.chat('extract', [
      { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
      { role: 'user', content: userMessage }
    ])

    const jsonStr = response.content.match(/\{[\s\S]*\}/)?.[0]
    if (!jsonStr) { callbacks.onNoExtraction(); return }

    const parsed = JSON.parse(jsonStr)
    if (!parsed.entities?.length) { callbacks.onNoExtraction(); return }

    const card: ExtractionCard = {
      id: `ext_${Date.now()}`,
      timestamp: new Date().toISOString(),
      summary: parsed.summary ?? '',
      entities: parsed.entities.map((e: Record<string, unknown>, i: number) => ({
        category: e.category as ExtractionCard['entities'][0]['category'],
        name: e.name as string,
        value: e.value as string,
        relation: (parsed.relations?.[i]?.type as string) ?? 'new'
      })),
      suggestedQuestions: (parsed.suggestedQuestions as string[]) ?? [],
      confirmed: false
    }

    if (card.entities.length > 0) {
      existingSummary += `\n${card.summary}`
      callbacks.onCardGenerated(card)
    } else {
      callbacks.onNoExtraction()
    }
  } catch {
    callbacks.onNoExtraction()
  }
}
