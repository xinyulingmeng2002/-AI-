// 敏感词检测服务

const SENSITIVE_PATTERNS: Array<{ pattern: RegExp; label: string; severity: 'high' | 'medium' }> = [
  // 高风险
  { pattern: /习近平|毛泽东|邓小平|江泽民|胡锦涛/g, label: '政治人物名', severity: 'high' },
  { pattern: /台独|藏独|疆独|港独|两国论|一边一国/g, label: '分裂主义', severity: 'high' },
  { pattern: /法轮功|六四|天安门|八九/g, label: '敏感事件', severity: 'high' },
  { pattern: /毒品制作|枪支制造|爆炸物制造|炸弹制作/g, label: '违禁内容', severity: 'high' },
  { pattern: /分裂国家|颠覆政权|推翻/g, label: '政治敏感', severity: 'high' },
  // 中风险
  { pattern: /色情|淫秽|嫖娼|卖淫|裸体|性交|强奸/g, label: '色情内容', severity: 'medium' },
  { pattern: /赌博|赌场|赌局|博彩|网赌/g, label: '赌博内容', severity: 'medium' },
  { pattern: /暴力恐怖|血腥|虐杀|肢解/g, label: '暴力内容', severity: 'medium' },
  { pattern: /自杀|自残|割腕/g, label: '自残内容', severity: 'medium' },
  { pattern: /邪教|传销|非法集资/g, label: '违法内容', severity: 'medium' },
  { pattern: /歧视|种族|宗教侮辱/g, label: '歧视内容', severity: 'medium' },
]

export interface SensitiveMatch {
  word: string
  label: string
  severity: 'high' | 'medium'
  position: number
}

export function detectSensitiveWords(text: string): SensitiveMatch[] {
  const matches: SensitiveMatch[] = []
  for (const pattern of SENSITIVE_PATTERNS) {
    let match: RegExpExecArray | null
    pattern.lastIndex = 0
    while ((match = pattern.exec(text)) !== null) {
      matches.push({
        word: match[0],
        label: pattern.label,
        severity: pattern.severity,
        position: match.index
      })
    }
  }
  return matches.sort((a, b) => a.position - b.position)
}

export function formatSensitiveReport(matches: SensitiveMatch[]): string {
  if (matches.length === 0) return ''
  const high = matches.filter((m) => m.severity === 'high')
  const medium = matches.filter((m) => m.severity === 'medium')

  let report = '## 敏感词检测\n\n'
  if (high.length > 0) {
    report += `### [严重] 高风险 (${high.length}处)\n`
    high.forEach((m) => { report += `- \`${m.word}\` — ${m.label}\n` })
  }
  if (medium.length > 0) {
    report += `\n### [警告] 中风险 (${medium.length}处)\n`
    medium.forEach((m) => { report += `- \`${m.word}\` — ${m.label}\n` })
  }
  return report
}
