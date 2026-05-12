// 语言风格检查器

export interface StyleIssue {
  type: 'redundancy' | 'repetition' | 'adverb_density' | 'passive_voice' | 'sentence_length'
  description: string
  location: number // 字符位置
  severity: 'warning' | 'suggestion'
  suggestion: string
}

const REDUNDANT_PATTERNS = [
  { pattern: /的的/g, label: '重复"的"字' },
  { pattern: /了了/g, label: '重复"了"字' },
  { pattern: /他他|她她|它它/g, label: '重复代词' },
  { pattern: /然后然后/g, label: '重复"然后"' },
  { pattern: /但是但是/g, label: '重复"但是"' },
  { pattern: /非常非常/g, label: '重复"非常"' },
]

const WEAK_ADVERBS = ['很', '非常', '特别', '极其', '十分', '太', '真', '挺', '蛮', '好']

const PASSIVE_INDICATORS = ['被', '给', '让', '叫', '受']

export function checkStyle(text: string): StyleIssue[] {
  if (!text.trim()) return []
  const issues: StyleIssue[] = []

  // 1. 冗余词检测
  for (const { pattern, label } of REDUNDANT_PATTERNS) {
    let match: RegExpExecArray | null
    pattern.lastIndex = 0
    while ((match = pattern.exec(text)) !== null) {
      issues.push({
        type: 'redundancy',
        description: `${label}: "${match[0]}"`,
        location: match.index,
        severity: 'suggestion',
        suggestion: '检查是否多打了字'
      })
    }
  }

  // 2. 副词密度
  let adverbCount = 0
  for (const adv of WEAK_ADVERBS) {
    const regex = new RegExp(adv, 'g')
    const matches = text.match(regex)
    if (matches) adverbCount += matches.length
  }
  const totalChars = text.length
  const adverbDensity = totalChars > 0 ? (adverbCount / totalChars) * 100 : 0
  if (adverbDensity > 2.5) {
    issues.push({
      type: 'adverb_density',
      description: `副词密度偏高 (${adverbDensity.toFixed(1)}%，检测到${adverbCount}个弱化副词)`,
      location: 0,
      severity: 'suggestion',
      suggestion: '考虑用更具体的描写替代弱化副词（很/非常/特别等），增强画面感'
    })
  }

  // 3. 被字句密度
  let passiveCount = 0
  for (const pi of PASSIVE_INDICATORS) {
    const regex = new RegExp(pi, 'g')
    const matches = text.match(regex)
    if (matches) passiveCount += matches.length
  }
  if (passiveCount > 15) {
    issues.push({
      type: 'passive_voice',
      description: `被动表达较多 (${passiveCount}处)，可能影响行文的主动感和力量感`,
      location: 0,
      severity: 'suggestion',
      suggestion: '尝试将部分被动句改写为主动句，增强行文的张力和节奏感'
    })
  }

  // 4. 句子长度分析
  const sentences = text.split(/[。！？!?\n]/).filter((s) => s.trim())
  const longSentences = sentences.filter((s) => s.length > 100)
  if (longSentences.length > 3) {
    issues.push({
      type: 'sentence_length',
      description: `有${longSentences.length}个超长句子(>100字)，可能影响阅读节奏`,
      location: 0,
      severity: 'suggestion',
      suggestion: '适当拆分超长句子，用短句制造节奏感，用长句铺陈细节'
    })
  }

  return issues
}

export function formatStyleReport(issues: StyleIssue[]): string {
  if (issues.length === 0) return ''

  const byType = issues.reduce<Record<string, StyleIssue[]>>((acc, i) => {
    (acc[i.type] ??= []).push(i)
    return acc
  }, {})

  let report = '## 语言风格检查\n\n'
  for (const [type, items] of Object.entries(byType)) {
    const label = {
      redundancy: '冗余用词', repetition: '重复句式',
      adverb_density: '副词密度', passive_voice: '被动表达',
      sentence_length: '句子长度'
    }[type] ?? type

    report += `### ${label}\n`
    items.slice(0, 5).forEach((i) => {
      report += `- ${i.description} → ${i.suggestion}\n`
    })
    report += '\n'
  }

  return report
}
