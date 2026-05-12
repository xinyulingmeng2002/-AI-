// 审计服务 — 桥接核心审计引擎与 UI

import { runAudit } from '@mindforge/core'
import type { ChapterOutline, ChapterSummary, AuditResult } from '@mindforge/shared'

export interface AuditTriggerContext {
  chapterOutline: ChapterOutline
  chapterContent: string
}

export async function triggerAudit(context: AuditTriggerContext): Promise<AuditResult> {
  // 从数据库加载辅助数据
  let previousSummaries: ChapterSummary[] = []
  let existingHooks: Array<{ id: string; description: string; importance: string }> = []
  let characters: Array<{ id: string; name: string; currentState: string }> = []

  try {
    // 获取前几章摘要
    const chaptersResult = await window.mindforge.db.getAll(
      'chapter_summaries',
      context.chapterOutline.chapterId // workspace_id 用 chapter_id 代替，实际应从 workspace 获取
    )

    // 获取伏笔列表
    const hooksResult = await window.mindforge.db.getAll(
      'pending_hooks',
      context.chapterOutline.chapterId
    )
    if (hooksResult.success && hooksResult.data) {
      existingHooks = hooksResult.data.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        description: (r.data_json as string) || '',
        importance: 'major'
      }))
    }

    // 获取人物列表
    const charactersResult = await window.mindforge.db.getAll(
      'characters',
      context.chapterOutline.chapterId
    )
    if (charactersResult.success && charactersResult.data) {
      characters = charactersResult.data.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        name: r.name as string,
        currentState: 'alive'
      }))
    }
  } catch {
    // 数据库查询失败不影响审计，使用空数据
  }

  return runAudit({
    chapterOutline: context.chapterOutline,
    chapterContent: context.chapterContent,
    chapterSummary: null,
    previousSummaries,
    existingHooks,
    characters
  })
}

/** 将审计结果格式化为聊天消息 */
export function formatAuditMessage(result: AuditResult): string {
  if (result.issues.length === 0) {
    return `## 章节审核通过 ✅\n\n综合评分：${result.overallScore}/100\n\n没有任何问题，章节质量良好！`
  }

  const criticals = result.issues.filter((i) => i.severity === 'critical')
  const warnings = result.issues.filter((i) => i.severity === 'warning')
  const suggestions = result.issues.filter((i) => i.severity === 'suggestion')

  let msg = `## 章节审核报告\n\n**综合评分：${result.overallScore}/100**`
  msg += `\n- 🔴 严重问题：${criticals.length} 个`
  msg += `\n- 🟡 警告：${warnings.length} 个`
  msg += `\n- 🔵 建议：${suggestions.length} 个`

  if (criticals.length > 0) {
    msg += '\n\n### 🔴 严重问题\n'
    criticals.forEach((i) => {
      msg += `\n- **${i.dimension}**: ${i.description}\n  → ${i.suggestion}`
    })
  }

  if (warnings.length > 0) {
    msg += '\n\n### 🟡 警告\n'
    warnings.forEach((i) => {
      msg += `\n- **${i.dimension}**: ${i.description}\n  → ${i.suggestion}`
    })
  }

  if (suggestions.length > 0) {
    msg += '\n\n### 🔵 建议\n'
    suggestions.slice(0, 5).forEach((i) => {
      msg += `\n- **${i.dimension}**: ${i.description}`
    })
  }

  return msg
}
