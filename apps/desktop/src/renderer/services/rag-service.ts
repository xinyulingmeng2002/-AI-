// RAG 检索服务 — 关键词 + 可选LLM嵌入语义搜索

import { chunkText, extractKeywords, relevanceScore, type TextChunk } from '@mindforge/core'
import { createRouter } from '@mindforge/core'
import { useModelConfigStore } from '@/stores/model-config'

export interface SearchResult {
  chunk: TextChunk
  score: number
  matchType: 'keyword' | 'fts'
}

/** 为章节内容建立索引 */
export async function indexChapter(
  chapterId: string,
  content: string,
  volumeNumber: number,
  chapterNumber: number,
  workspaceId: string
): Promise<void> {
  const chunks = chunkText(content, chapterId, volumeNumber, chapterNumber, {
    workspaceId
  })

  for (const chunk of chunks) {
    try {
      await window.mindforge.db.insert('chapters_fts', {
        chunk_id: chunk.id,
        content: chunk.content,
        chapter_id: chunk.chapterId,
        volume_number: chunk.volumeNumber,
        chapter_number: chunk.chapterNumber
      })
    } catch {
      // FTS表可能不支持标准insert，跳过
    }
  }
}

/** 混合检索 */
export async function searchRelevantContext(
  query: string,
  workspaceId: string,
  topK = 5
): Promise<SearchResult[]> {
  const results: SearchResult[] = []

  // 1. FTS5 全文检索
  try {
    const allChunks = await window.mindforge.db.getAll('chapters_fts', workspaceId)
    if (allChunks.success && allChunks.data) {
      const queryTerms = extractKeywords(query, 10).join(' OR ')
      for (const row of allChunks.data as Record<string, unknown>[]) {
        const content = (row.content as string) ?? ''
        if (queryTerms.split(' OR ').some((t) => content.includes(t))) {
          const chunk: TextChunk = {
            id: (row.chunk_id as string) ?? '',
            content,
            startIndex: 0,
            endIndex: content.length,
            chapterId: (row.chapter_id as string) ?? '',
            volumeNumber: (row.volume_number as number) ?? 1,
            chapterNumber: (row.chapter_number as number) ?? 1,
            metadata: {}
          }
          const score = relevanceScore(query, chunk)
          if (score > 0) {
            results.push({ chunk, score, matchType: 'keyword' })
          }
        }
      }
    }
  } catch { /* FTS表可能不存在，跳过 */ }

  // 2. 从 chapter_summaries 搜索章节摘要
  try {
    const chapters = await window.mindforge.db.getAll('chapter_summaries', workspaceId)
    if (chapters.success && chapters.data) {
      for (const row of chapters.data as Record<string, unknown>[]) {
        const content = (row.content as string) ?? ''
        const queryKeywords = extractKeywords(query, 15)
        const matchCount = queryKeywords.filter((kw) => content.includes(kw)).length
        if (matchCount > 0) {
          const chunk: TextChunk = {
            id: `ch_${row.id}`,
            content: content.slice(0, 800),
            startIndex: 0,
            endIndex: content.length,
            chapterId: (row.id as string) ?? '',
            volumeNumber: (row.volume_number as number) ?? 1,
            chapterNumber: (row.chapter_number as number) ?? 1,
            metadata: {}
          }
          results.push({ chunk, score: matchCount, matchType: 'keyword' })
        }
      }
    }
  } catch { /* skip */ }

  // 排序去重，返回 Top-K
  return results
    .sort((a, b) => b.score - a.score)
    .filter((r, i, arr) => arr.findIndex((x) => x.chunk.id === r.chunk.id) === i)
    .slice(0, topK)
}

/** LLM 语义搜索 — 使用模型判断相关性 */
export async function semanticSearch(
  query: string,
  candidates: SearchResult[],
  topK = 3
): Promise<SearchResult[]> {
  if (candidates.length === 0) return []

  const store = useModelConfigStore.getState()
  const configs = store.toCoreConfigs()
  if (configs.length === 0) return candidates.slice(0, topK)

  try {
    const router = createRouter(configs, store.defaultModelId)
    const chunks = candidates.map((r, i) =>
      `[${i}] 第${r.chunk.volumeNumber}卷${r.chunk.chapterNumber}章: ${r.chunk.content.slice(0, 200)}`
    ).join('\n---\n')

    const response = await router.chat('extract', [
      { role: 'system', content: '你是一个检索助手。根据查询判断哪些章节片段最相关。只返回相关片段的编号，用逗号分隔，如：0,2,5。不要返回其他内容。' },
      { role: 'user', content: `查询：${query}\n\n候选片段：\n${chunks}\n\n请返回最相关的${topK}个片段编号。` }
    ])

    const indices = (response.content.match(/\d+/g) ?? []).map(Number).filter((n) => n >= 0 && n < candidates.length)
    if (indices.length > 0) {
      return indices.slice(0, topK).map((i) => candidates[i])
    }
  } catch { /* fallback to keyword */ }

  return candidates.slice(0, topK)
}

/** 构建 RAG 增强的系统提示 */
export function buildRAGContext(results: SearchResult[]): string {
  if (results.length === 0) return ''
  let ctx = '\n\n## 相关上下文（从已写章节中检索）\n'
  for (const r of results) {
    ctx += `\n[第${r.chunk.volumeNumber}卷第${r.chunk.chapterNumber}章] ${r.chunk.content.slice(0, 300)}...\n`
  }
  return ctx
}
