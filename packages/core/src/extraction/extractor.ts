// 要素提取器 — 核心提取逻辑

import type { ExtractionResult, ExtractionCard } from './types'
import { EXTRACTION_SYSTEM_PROMPT, EXTRACTION_USER_PROMPT } from './prompts'

export interface ExtractorConfig {
  /** 调用 LLM 进行提取的函数 */
  callLLM: (messages: Array<{ role: string; content: string }>) => Promise<string>
  /** 获取现有设定摘要 */
  getExistingSummary: () => string
}

export function createExtractor(config: ExtractorConfig) {
  let cardCounter = 0

  async function extract(userMessage: string): Promise<ExtractionResult | null> {
    const existingSummary = config.getExistingSummary()
    const userPrompt = EXTRACTION_USER_PROMPT(userMessage, existingSummary)

    try {
      const response = await config.callLLM([
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ])

      // 解析 JSON 响应
      const jsonStr = extractJSON(response)
      const result = JSON.parse(jsonStr) as ExtractionResult

      // 验证必填字段
      if (!result.intent || !result.entities || !result.relations) {
        console.warn('Extraction result missing required fields:', result)
        return null
      }

      return result
    } catch (e) {
      console.error('Extraction failed:', e)
      return null
    }
  }

  function toExtractionCard(result: ExtractionResult): ExtractionCard {
    cardCounter++
    return {
      id: `ext_${Date.now()}_${cardCounter}`,
      timestamp: new Date().toISOString(),
      summary: result.summary,
      entities: result.entities.map((entity, idx) => ({
        category: entity.category,
        name: entity.name,
        value: entity.value,
        relation: result.relations[idx]?.type ?? 'new'
      })),
      suggestedQuestions: result.suggestedQuestions ?? [],
      confirmed: false
    }
  }

  /** 判断用户消息是否值得提取（过滤纯闲聊） */
  function shouldExtract(userMessage: string): boolean {
    const trimmed = userMessage.trim()
    // 太短的消息不提取
    if (trimmed.length < 15) return false
    // 纯提问不提取
    if (/^[?？]/.test(trimmed) && trimmed.length < 30) return false
    // 纯情绪表达不提取（"好的"、"嗯"、"谢谢"等）
    if (/^(好的|嗯|谢谢|明白了|知道了|ok|OK|行|对|是的|没错)$/.test(trimmed)) return false
    return true
  }

  return { extract, toExtractionCard, shouldExtract }
}

/** 从 LLM 响应中提取 JSON 字符串 */
function extractJSON(text: string): string {
  // 尝试匹配 ```json ... ``` 代码块
  const codeBlock = text.match(/```json\s*([\s\S]*?)\s*```/)
  if (codeBlock) return codeBlock[1]

  // 尝试匹配 { ... } 直接出现的 JSON
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1)
  }

  throw new Error('No valid JSON found in extraction response')
}
