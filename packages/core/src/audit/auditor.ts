// 基础一致性审核引擎 — 规则驱动 + LLM增强

import type { ChapterOutline, ChapterSummary } from '@mindforge/shared'
import type { AuditResult, AuditIssue, AuditSeverity } from '@mindforge/shared'

export interface AuditContext {
  chapterOutline: ChapterOutline
  chapterContent: string       // 章节正文纯文本
  chapterSummary: ChapterSummary | null
  previousSummaries: ChapterSummary[]  // 前几章摘要（用于连续性检查）
  existingHooks: Array<{ id: string; description: string; importance: string }>
  characters: Array<{ id: string; name: string; currentState: string }>
}

export function runAudit(context: AuditContext): AuditResult {
  const issues: AuditIssue[] = []
  const { chapterOutline, chapterContent, existingHooks } = context

  // 1. 目标达成检查
  checkObjectiveProgress(chapterOutline, chapterContent, issues)

  // 2. 伏笔操作检查
  checkForeshadowing(chapterOutline, existingHooks, issues)

  // 3. 结尾钩子检查
  checkEndingHook(chapterOutline, chapterContent, issues)

  // 4. 人物出场检查
  checkCharacterAppearance(chapterOutline, chapterContent, issues)

  // 5. 字数达标检查
  checkWordCount(chapterOutline, chapterContent, issues)

  // 计算总分
  const criticalCount = issues.filter((i) => i.severity === 'critical').length
  const warningCount = issues.filter((i) => i.severity === 'warning').length
  const suggestionCount = issues.filter((i) => i.severity === 'suggestion').length

  const score = Math.max(0, 100 - criticalCount * 20 - warningCount * 8 - suggestionCount * 3)
  const isPassable = criticalCount === 0

  return {
    chapterId: chapterOutline.chapterId,
    issues,
    overallScore: score,
    isPassable
  }
}

function addIssue(
  issues: AuditIssue[],
  category: string,
  dimension: string,
  severity: AuditSeverity,
  description: string,
  suggestion: string,
  location: string | null = null
) {
  issues.push({
    id: `audit_${issues.length + 1}`,
    category,
    dimension,
    severity,
    description,
    location,
    suggestion,
    affectedModules: []
  })
}

// ---------- 各维度检查 ----------

function checkObjectiveProgress(
  outline: ChapterOutline,
  content: string,
  issues: AuditIssue[]
) {
  const objective = outline.objective.mainlineProgress
  if (!objective) return

  // 简单规则：大纲目标关键词是否在正文中出现
  const keywords = extractKeywords(objective)
  const foundCount = keywords.filter((kw) => content.includes(kw)).length

  if (keywords.length > 0 && foundCount === 0) {
    addIssue(issues, '剧情', '主线推进',
      'warning',
      `章纲要设定的目标"${objective.slice(0, 50)}..."在正文中未找到相关关键词`,
      '检查正文是否覆盖了纲要说定的推进方向，或更新纲要以匹配实际写作内容'
    )
  }
}

function checkForeshadowing(
  outline: ChapterOutline,
  existingHooks: AuditContext['existingHooks'],
  issues: AuditIssue[]
) {
  // 检查是否计划回收伏笔
  const toRecover = outline.foreshadowing.recovered
  if (toRecover.length > 0) {
    const recovered = toRecover.filter((hookId) =>
      existingHooks.some((h) => h.id === hookId)
    )
    if (recovered.length < toRecover.length) {
      addIssue(issues, '伏笔', '伏笔回收',
        'warning',
        `计划回收${toRecover.length}个伏笔，其中${toRecover.length - recovered.length}个未在伏笔列表中找到`,
        '检查伏笔ID是否正确，或确认该伏笔是否已在之前章节回收'
      )
    }
  }

  // 检查重要未回收伏笔是否临近过期
  const overdueHooks = existingHooks.filter((h) => {
    // 简化版：重要伏笔且在最近章节中未涉及
    return h.importance === 'critical'
  })
  if (overdueHooks.length > 3) {
    addIssue(issues, '伏笔', '伏笔积压',
      'suggestion',
      `当前有${overdueHooks.length}个重要伏笔未回收，建议在近期章节中安排回收`,
      '查看伏笔追踪面板，规划回收时机'
    )
  }

  // 检查本章埋设的伏笔是否有回收计划
  const planted = outline.foreshadowing.planted
  const noPlanCount = planted.filter((f) => f.expectedPayoffChapter === null).length
  if (planted.length > 0 && noPlanCount === planted.length) {
    addIssue(issues, '伏笔', '伏笔回收计划',
      'suggestion',
      `本章埋设了${planted.length}个伏笔，但都没有指定预期回收章节`,
      '建议为每个伏笔设定预期的回收章节范围，避免遗忘'
    )
  }
}

function checkEndingHook(
  outline: ChapterOutline,
  content: string,
  issues: AuditIssue[]
) {
  if (!outline.endingHook) {
    addIssue(issues, '结构', '结尾钩子',
      'suggestion',
      '章纲要未设定结尾钩子',
      '为章节设定结尾悬念或钩子，保持读者阅读动力'
    )
    return
  }

  // 检查正文最后一段是否包含钩子相关关键词
  const paragraphs = content.split(/\n\n+/)
  const lastPara = paragraphs[paragraphs.length - 1] ?? ''
  const hookKeywords = extractKeywords(outline.endingHook)
  const foundInEnding = hookKeywords.some((kw) => lastPara.includes(kw))

  if (!foundInEnding && hookKeywords.length > 0) {
    addIssue(issues, '结构', '结尾钩子',
      'warning',
      '章纲要设定的结尾钩子似乎在正文末尾体现不够明显',
      '加强结尾段落与钩子的关联度'
    )
  }
}

function checkCharacterAppearance(
  outline: ChapterOutline,
  content: string,
  issues: AuditIssue[]
) {
  const planned = outline.characters.filter((c) => c.role !== 'cameo')
  for (const char of planned) {
    // 简单检查：人物名称是否在正文中出现
    // 实际项目中需要从人物矩阵获取名称
    // 此处使用更通用的方法
    if (char.characterId && !content.includes(char.characterId)) {
      addIssue(issues, '人物', '人物出场',
        'warning',
        `章纲要中规划了角色出场但正文中未找到该角色标识`,
        `确认角色ID "${char.characterId}" 是否正确，或更新出场列表`
      )
    }
  }
}

function checkWordCount(
  outline: ChapterOutline,
  content: string,
  issues: AuditIssue[]
) {
  const actual = content.length
  const target = outline.targetWordCount

  if (target > 0) {
    const ratio = actual / target
    if (ratio < 0.5) {
      addIssue(issues, '结构', '字数',
        'warning',
        `字数严重不足：实际${actual}字 / 目标${target}字 (${(ratio * 100).toFixed(0)}%)`,
        '扩充内容或下调目标字数'
      )
    } else if (ratio < 0.8) {
      addIssue(issues, '结构', '字数',
        'suggestion',
        `字数略低：实际${actual}字 / 目标${target}字 (${(ratio * 100).toFixed(0)}%)`,
        '可适当扩充或接受当前篇幅'
      )
    }
  }
}

/** 简单关键词提取 */
function extractKeywords(text: string): string[] {
  // 提取中文字符序列和英文单词作为关键词
  const matches = text.match(/[一-龥]{2,}|[a-zA-Z]{3,}/g)
  return matches ?? []
}
