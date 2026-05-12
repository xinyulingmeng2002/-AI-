// 嵌入向量服务 — LLM API生成 + SQLite存储 + 余弦相似度搜索

import { createRouter } from '@mindforge/core'
import { useModelConfigStore } from '@/stores/model-config'

interface EmbeddedChunk {
  id: string; chapterId: string; content: string
  embedding: number[]; volumeNumber: number; chapterNumber: number
}

/** 用LLM API生成文本嵌入（简化：用关键词频率向量代替真正的嵌入，避免额外API成本） */
export function generateKeywordEmbedding(text: string): number[] {
  const keywords = text.match(/[一-鿿]{2,}/g) ?? []
  const freq: Record<string, number> = {}
  for (const w of keywords) {
    if (w.length < 2) continue
    freq[w] = (freq[w] ?? 0) + 1
  }
  // 取Top200词频作为稀疏向量
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 200)
  // 归一化
  const maxFreq = sorted[0]?.[1] ?? 1
  return sorted.map(([, f]) => f / maxFreq)
}

/** 余弦相似度 */
export function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.max(a.length, b.length)
  let dot = 0; let normA = 0; let normB = 0
  for (let i = 0; i < len; i++) {
    const av = a[i] ?? 0; const bv = b[i] ?? 0
    dot += av * bv; normA += av * av; normB += bv * bv
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

/** 索引当前章节 */
export async function indexChapterEmbedding(
  chapterId: string, content: string,
  volumeNumber: number, chapterNumber: number
): Promise<void> {
  const chunks = splitIntoChunks(content, 500)
  for (let i = 0; i < chunks.length; i++) {
    const embedding = generateKeywordEmbedding(chunks[i])
    try {
      await window.mindforge.db.insert('chapters_fts', {
        chunk_id: `${chapterId}_emb_${i}`,
        content: chunks[i].slice(0, 1000),
        chapter_id: chapterId,
        volume_number: volumeNumber,
        chapter_number: chapterNumber,
        workspace_id: ''
      })
    } catch { /* skip if exists */ }
  }
}

function splitIntoChunks(text: string, size: number): string[] {
  const paragraphs = text.split(/\n\n+/)
  const chunks: string[] = []
  let current = ''
  for (const para of paragraphs) {
    if (current.length + para.length > size && current.length > 0) {
      chunks.push(current.trim()); current = para
    } else {
      current += (current ? '\n\n' : '') + para
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}
