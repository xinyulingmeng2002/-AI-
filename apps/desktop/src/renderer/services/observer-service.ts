// Observer Agent — 章节完成后自动提取事实

import { createRouter, EXTRACTION_SYSTEM_PROMPT } from '@mindforge/core'
import { useModelConfigStore } from '@/stores/model-config'
import { applyExtractionCard } from './truth-files-service'
import type { ExtractionCard } from '@mindforge/core'

export interface ObserverResult {
  card: ExtractionCard | null
  error?: string
}

/** 章节完成后运行 Observer */
export async function runObserver(
  chapterContent: string,
  chapterTitle: string,
  workspaceId: string
): Promise<ObserverResult> {
  const store = useModelConfigStore.getState()
  const configs = store.toCoreConfigs()
  if (configs.length === 0) {
    return { card: null, error: '未配置模型' }
  }

  const router = createRouter(configs, store.defaultModelId)

  try {
    const response = await router.chat('extract', [
      { role: 'system', content: `${EXTRACTION_SYSTEM_PROMPT}\n\n你正在分析的是已完成的章节正文。请从中提取新增的人物、地点、事件、伏笔等要素。` },
      { role: 'user', content: `章节标题：${chapterTitle}\n\n章节正文（前3000字）：\n${chapterContent.slice(0, 3000)}` }
    ])

    const jsonStr = response.content.match(/\{[\s\S]*\}/)?.[0]
    if (!jsonStr) return { card: null }

    const parsed = JSON.parse(jsonStr)
    const card: ExtractionCard = {
      id: `observer_${Date.now()}`,
      timestamp: new Date().toISOString(),
      summary: parsed.summary ?? 'Observer 自动提取',
      entities: (parsed.entities ?? []).map((e: Record<string, unknown>, i: number) => ({
        category: e.category as never,
        name: e.name as string,
        value: e.value as string,
        relation: (parsed.relations?.[i]?.type as string) ?? 'new'
      })),
      suggestedQuestions: parsed.suggestedQuestions ?? [],
      confirmed: false
    }

    // 自动应用提取结果
    if (card.entities.length > 0) {
      await applyExtractionCard(card, workspaceId)
    }

    return { card }
  } catch (e) {
    return { card: null, error: (e as Error).message }
  }
}
