// 文本分块器 — 将长文本分割为适合检索的语义块

export interface TextChunk {
  id: string
  content: string
  startIndex: number
  endIndex: number
  chapterId: string
  volumeNumber: number
  chapterNumber: number
  metadata: Record<string, string>
}

const CHUNK_SIZE = 500     // 每块目标字符数
const CHUNK_OVERLAP = 100  // 块间重叠字符数

export function chunkText(
  text: string,
  chapterId: string,
  volumeNumber: number,
  chapterNumber: number,
  metadata: Record<string, string> = {}
): TextChunk[] {
  if (!text.trim()) return []

  const chunks: TextChunk[] = []
  const paragraphs = text.split(/\n\n+/)
  let currentChunk = ''
  let startIndex = 0
  let chunkIndex = 0

  for (const para of paragraphs) {
    const trimmed = para.trim()
    if (!trimmed) continue

    // 如果当前块加上新段落会超过目标大小，保存当前块
    if (currentChunk.length + trimmed.length > CHUNK_SIZE && currentChunk.length > 0) {
      chunks.push(createChunk(currentChunk.trim(), startIndex, chapterId, volumeNumber, chapterNumber, metadata, chunkIndex++))
      // 保留最后一段作为重叠
      const overlap = currentChunk.slice(-CHUNK_OVERLAP)
      currentChunk = overlap + '\n\n' + trimmed
      startIndex = startIndex + currentChunk.indexOf(trimmed) - CHUNK_OVERLAP
    } else {
      if (currentChunk) currentChunk += '\n\n'
      currentChunk += trimmed
    }
  }

  // 最后一个块
  if (currentChunk.trim()) {
    chunks.push(createChunk(currentChunk.trim(), startIndex, chapterId, volumeNumber, chapterNumber, metadata, chunkIndex))
  }

  return chunks
}

function createChunk(
  content: string,
  startIndex: number,
  chapterId: string,
  volumeNumber: number,
  chapterNumber: number,
  metadata: Record<string, string>,
  index: number
): TextChunk {
  return {
    id: `${chapterId}_chunk_${index}`,
    content,
    startIndex,
    endIndex: startIndex + content.length,
    chapterId,
    volumeNumber,
    chapterNumber,
    metadata: { ...metadata, chunkIndex: String(index) }
  }
}

/** 关键词提取（简单TF） */
export function extractKeywords(text: string, topN = 10): string[] {
  const words = text.match(/[一-鿿]{2,}|[a-zA-Z]{3,}/g) ?? []
  const freq: Record<string, number> = {}
  for (const w of words) {
    freq[w] = (freq[w] ?? 0) + 1
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([k]) => k)
}

/** 简单相关度评分（关键词重叠） */
export function relevanceScore(query: string, chunk: TextChunk): number {
  const queryKeywords = new Set(extractKeywords(query, 20))
  const chunkKeywords = extractKeywords(chunk.content, 20)
  let score = 0
  for (const kw of chunkKeywords) {
    if (queryKeywords.has(kw)) score += 1
  }
  return score
}
