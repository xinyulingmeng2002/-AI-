// 敏感词检测服务

const SENSITIVE_PATTERNS: Array<{ pattern: RegExp; label: string; severity: 'high' | 'medium' }> = [
  { pattern: /习近平|毛泽东|邓小平/g, label: '政治人物名', severity: 'high' },
  { pattern: /台独|藏独|疆独|港独/g, label: '分裂主义', severity: 'high' },
  { pattern: /法轮功|六四|天安门/g, label: '敏感事件', severity: 'high' },
  { pattern: /毒品制作|枪支制造|爆炸物/g, label: '违禁内容', severity: 'high' },
  { pattern: /色情|淫秽|嫖娼|卖淫/g, label: '色情内容', severity: 'medium' },
  { pattern: /赌博|赌场|赌局/g, label: '赌博内容', severity: 'medium' },
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
    report += `### 🔴 高风险 (${high.length}处)\n`
    high.forEach((m) => { report += `- \`${m.word}\` — ${m.label}\n` })
  }
  if (medium.length > 0) {
    report += `\n### 🟡 中风险 (${medium.length}处)\n`
    medium.forEach((m) => { report += `- \`${m.word}\` — ${m.label}\n` })
  }
  return report
}
