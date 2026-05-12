// 统计数据服务

export interface WritingStats {
  totalWords: number
  totalChapters: number
  todayWords: number
  streak: number
  lastWriteDate: string | null
}

export async function getWritingStats(): Promise<WritingStats> {
  try {
    // 获取所有作品
    const wsResult = await window.mindforge.workspace.list()
    if (!wsResult.success || !wsResult.data) {
      return emptyStats()
    }

    const workspaces = wsResult.data as Record<string, unknown>[]
    let totalWords = 0
    let totalChapters = 0
    let todayWords = 0
    const today = new Date().toDateString()
    const writeDates = new Set<string>()

    for (const ws of workspaces) {
      const wsId = ws.id as string

      // 获取该作品的所有章节
      const chaptersResult = await window.mindforge.db.getAll('chapter_summaries', wsId)
      if (chaptersResult.success && chaptersResult.data) {
        const chapters = chaptersResult.data as Record<string, unknown>[]
        totalChapters += chapters.length

        for (const ch of chapters) {
          const content = (ch.content as string) ?? ''
          const wordCount = content.length
          totalWords += wordCount

          // 检查是否今天写的
          const updatedAt = (ch.updated_at as string) ?? ''
          if (updatedAt) {
            const updateDate = new Date(updatedAt).toDateString()
            writeDates.add(updateDate)
            if (updateDate === today) {
              todayWords += wordCount
            }
          }
        }
      }
    }

    // 计算连续天数
    const sortedDates = Array.from(writeDates).sort().reverse()
    let streak = 0
    const todayDate = new Date()
    for (let i = 0; i < sortedDates.length; i++) {
      const expected = new Date(todayDate)
      expected.setDate(expected.getDate() - i)
      if (sortedDates[i] === expected.toDateString()) {
        streak++
      } else if (i === 0) {
        // 今天还没写，检查昨天
        const yesterday = new Date(todayDate)
        yesterday.setDate(yesterday.getDate() - 1)
        if (sortedDates[i] === yesterday.toDateString()) {
          streak++
          continue
        }
      }
      break
    }

    const lastWriteDate = sortedDates[0] ?? null

    return { totalWords, totalChapters, todayWords, streak, lastWriteDate }
  } catch {
    return emptyStats()
  }
}

function emptyStats(): WritingStats {
  return { totalWords: 0, totalChapters: 0, todayWords: 0, streak: 0, lastWriteDate: null }
}
