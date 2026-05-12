// 节奏与结构分析器

export interface RhythmMetrics {
  // 章节级
  conflictDensity: number      // 冲突密度 (0-1)
  dialogueRatio: number        // 对话占比
  actionRatio: number          // 动作描写占比
  descriptionRatio: number     // 环境/心理描写占比
  emotionalVariation: number   // 情感变化幅度

  // 节奏指标
  tempo: 'fast' | 'medium' | 'slow'
  climaxPosition: number       // 高潮位置 (0-1, 相对章节末尾)
  hookStrength: number         // 结尾钩子强度 (0-1)

  // 建议
  suggestions: string[]
}

export interface NovelRhythmReport {
  chapterMetrics: Map<string, RhythmMetrics>
  overallTempo: 'fast' | 'balanced' | 'slow'
  paceVariance: number         // 节奏变化幅度
  deadZones: string[]          // 节奏过缓的章节
  overdriveZones: string[]     // 节奏过快的章节
  suggestions: string[]
}

// 动作动词
const ACTION_VERBS = ['打', '杀', '斩', '刺', '冲', '飞', '跳', '跑', '击', '踢', '推', '拉', '闪', '跃', '轰', '爆', '碎', '破', '撞', '摔', '劈', '砍', '射', '掷', '甩', '抽', '扫', '砸']
// 冲突关键词
const CONFLICT_WORDS = ['但', '却', '然而', '可是', '不过', '竟然', '突然', '危险', '危机', '敌人', '对手', '威胁', '背叛', '阴谋', '陷阱', '斗争', '对抗', '战斗', '决战']

export function analyzeChapterRhythm(content: string, isLastChapter: boolean): RhythmMetrics {
  const totalChars = content.length || 1
  const paragraphs = content.split(/\n\n+/)
  const sentences = content.split(/[。！？!?\n]+/).filter((s) => s.trim())

  // 冲突密度
  let conflictCount = 0
  for (const w of CONFLICT_WORDS) {
    conflictCount += (content.match(new RegExp(w, 'g')) ?? []).length
  }
  const conflictDensity = Math.min(1, conflictCount / (totalChars / 500))

  // 对话占比
  const dialogueChars = (content.match(/["""「][^"""」]+["»"」]/g) ?? []).join('').length
  const dialogueRatio = dialogueChars / totalChars

  // 动作占比
  let actionCount = 0
  for (const v of ACTION_VERBS) {
    actionCount += (content.match(new RegExp(v, 'g')) ?? []).length
  }
  const actionRatio = actionCount / (totalChars / 100)

  // 描写占比 = 1 - 对话 - 动作
  const descriptionRatio = Math.max(0, 1 - dialogueRatio - Math.min(0.5, actionRatio))

  // 情感变化
  const emotionWords = ['怒', '喜', '悲', '惊', '恐', '忧', '乐', '哀', '惧', '笑', '哭', '叹', '慌', '急']
  let emotionCount = 0
  for (const e of emotionWords) {
    emotionCount += (content.match(new RegExp(e, 'g')) ?? []).length
  }
  const emotionalVariation = emotionCount / (totalChars / 300)

  // 节奏判断
  const pace = actionRatio + conflictDensity
  let tempo: RhythmMetrics['tempo'] = 'medium'
  if (pace > 0.8) tempo = 'fast'
  else if (pace < 0.3) tempo = 'slow'

  // 高潮位置
  const lastQuarter = content.slice(-Math.floor(totalChars * 0.25))
  const lastQuarterConflict = CONFLICT_WORDS.filter((w) => lastQuarter.includes(w)).length
  const climaxPosition = lastQuarterConflict > 3 ? 0.85 : 0.5

  // 钩子强度
  const lastPara = paragraphs[paragraphs.length - 1] ?? ''
  const hookWords = ['?', '？', '难道', '究竟', '突然', '竟然', '意想不到', '就在这时', '下一秒']
  const hookHits = hookWords.filter((w) => lastPara.includes(w)).length
  const hookStrength = Math.min(1, hookHits / 3)

  // 建议
  const suggestions: string[] = []
  if (dialogueRatio > 0.6) suggestions.push('对话占比偏高(>60%)，建议增加动作和环境描写以丰富层次')
  if (conflictDensity < 0.2) suggestions.push('冲突密度偏低，建议增加矛盾或挑战来提升张力')
  if (hookStrength < 0.3 && isLastChapter) suggestions.push('结尾钩子不够强，建议加强悬念引导读者继续阅读')
  if (actionRatio < 0.5 && tempo === 'slow') suggestions.push('行动描写偏少，节奏偏慢，可适当加快叙事节奏')
  if (emotionalVariation > 2) suggestions.push('情感变化较丰富，注意保持过渡自然')
  if (suggestions.length === 0) suggestions.push('章节节奏均衡，各项指标在合理范围内')

  return {
    conflictDensity: Math.round(conflictDensity * 100) / 100,
    dialogueRatio: Math.round(dialogueRatio * 100) / 100,
    actionRatio: Math.round(actionRatio * 100) / 100,
    descriptionRatio: Math.round(descriptionRatio * 100) / 100,
    emotionalVariation: Math.round(emotionalVariation * 100) / 100,
    tempo, climaxPosition, hookStrength: Math.round(hookStrength * 100) / 100,
    suggestions
  }
}

export function analyzeNovelRhythm(chapters: Array<{ id: string; title: string; content: string }>): NovelRhythmReport {
  const chapterMetrics = new Map<string, RhythmMetrics>()
  const deadZones: string[] = []
  const overdriveZones: string[] = []

  for (let i = 0; i < chapters.length; i++) {
    const metrics = analyzeChapterRhythm(chapters[i].content, i === chapters.length - 1)
    chapterMetrics.set(chapters[i].id, metrics)
    if (metrics.tempo === 'slow') deadZones.push(chapters[i].title)
    if (metrics.tempo === 'fast' && metrics.conflictDensity > 0.7) overdriveZones.push(chapters[i].title)
  }

  // 整体节奏
  const tempos = Array.from(chapterMetrics.values()).map((m) => m.tempo)
  const fastCount = tempos.filter((t) => t === 'fast').length
  const slowCount = tempos.filter((t) => t === 'slow').length
  let overallTempo: NovelRhythmReport['overallTempo'] = 'balanced'
  if (fastCount > chapters.length * 0.6) overallTempo = 'fast'
  else if (slowCount > chapters.length * 0.5) overallTempo = 'slow'

  // 节奏变化（相邻章节tempo变化次数/总章节数）
  let paceChanges = 0
  for (let i = 1; i < tempos.length; i++) {
    if (tempos[i] !== tempos[i - 1]) paceChanges++
  }
  const paceVariance = chapters.length > 1 ? paceChanges / (chapters.length - 1) : 0

  const suggestions: string[] = []
  if (overallTempo === 'slow') suggestions.push('整体节奏偏慢，考虑在关键章节加速叙事节奏')
  if (paceVariance < 0.2) suggestions.push('章节节奏变化不足，建议安排快慢交替的节奏布局')
  if (deadZones.length > chapters.length * 0.3) suggestions.push(`超过30%章节(${deadZones.length}章)节奏偏慢`)
  if (overdriveZones.length > 0) suggestions.push(`${overdriveZones.length}个章节冲突密度极高，注意读者阅读疲劳`)

  return {
    chapterMetrics, overallTempo, paceVariance: Math.round(paceVariance * 100) / 100,
    deadZones, overdriveZones, suggestions
  }
}

export function formatRhythmReport(report: NovelRhythmReport): string {
  let msg = `## 全书节奏分析\n\n**整体节奏**: ${
    report.overallTempo === 'fast' ? '偏快⚡' : report.overallTempo === 'slow' ? '偏慢🐢' : '均衡✅'
  } | 节奏变化率: ${Math.round(report.paceVariance * 100)}%`

  if (report.deadZones.length > 0) {
    msg += `\n\n### 节奏偏慢的章节\n${report.deadZones.map((t) => `- ${t}`).join('\n')}`
  }
  if (report.overdriveZones.length > 0) {
    msg += `\n\n### 高密度章节\n${report.overdriveZones.map((t) => `- ${t}`).join('\n')}`
  }
  if (report.suggestions.length > 0) {
    msg += `\n\n### 建议\n${report.suggestions.map((s) => `- ${s}`).join('\n')}`
  }

  return msg
}
