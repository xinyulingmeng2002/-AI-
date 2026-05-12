// 写法引擎 — 从参考文本提取风格特征

export interface StyleProfile {
  avgSentenceLength: number
  sentenceLengthVariance: number
  paragraphLength: number
  dialogueRatio: number        // 对话占比
  adjectiveDensity: number     // 形容词密度
  commonWords: string[]        // 高频词Top20
  sentenceStarters: string[]   // 常用句式开头
  actionBeatFrequency: number  // 动作节拍频率（每千字）
  povConsistency: 'first' | 'third_limited' | 'third_omniscient' | 'mixed'
}

export function extractStyleProfile(text: string): StyleProfile {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (!clean) return emptyProfile()

  // 句子分析
  const sentences = clean.split(/[。！？!?\n]+/).filter((s) => s.trim().length > 0)
  const lengths = sentences.map((s) => s.length)
  const avgLen = lengths.reduce((a, b) => a + b, 0) / Math.max(lengths.length, 1)
  const variance = lengths.reduce((sum, l) => sum + (l - avgLen) ** 2, 0) / Math.max(lengths.length, 1)

  // 段落分析
  const paragraphs = clean.split(/\n\n+/).filter((p) => p.trim())
  const avgParaLen = paragraphs.reduce((sum, p) => sum + p.length, 0) / Math.max(paragraphs.length, 1)

  // 对话占比
  const dialogueChars = (clean.match(/["""][^"""]+["»"]/g) ?? []).join('').length
  const dialogueRatio = clean.length > 0 ? dialogueChars / clean.length : 0

  // 形容词密度
  const adjMatches = clean.match(/的(?=[^的]+[的地得])/g)
  const adjDensity = adjMatches ? adjMatches.length / clean.length * 100 : 0

  // 高频词
  const words = clean.match(/[一-鿿]{2,}/g) ?? []
  const freq: Record<string, number> = {}
  for (const w of words) {
    if (/^(这是|一个|什么|我们|他们|自己|可以|没有|不是|已经|因为|所以|但是|如果|就是|还是|不过)/.test(w)) continue
    freq[w] = (freq[w] ?? 0) + 1
  }
  const commonWords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([k]) => k)

  // 句式开头
  const starters = sentences
    .map((s) => s.trim().slice(0, 3))
    .filter((s) => s.length >= 2)
  const starterFreq: Record<string, number> = {}
  for (const s of starters) starterFreq[s] = (starterFreq[s] ?? 0) + 1
  const sentenceStarters = Object.entries(starterFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([k]) => k)

  // 动作节拍（每千字）
  const actionMatches = clean.match(/(挥|打|跑|跳|飞|斩|刺|击|冲|闪|跃|踢|推|拉|举|握|拔|抽)/g)
  const actionFreq = actionMatches ? actionMatches.length / (clean.length / 1000) : 0

  // POV判断（简单启发式）
  const firstPersonCount = (clean.match(/我[^们]/g) ?? []).length
  const thirdPersonCount = (clean.match(/他|她/g) ?? []).length
  let povConsistency: StyleProfile['povConsistency'] = 'third_limited'
  if (firstPersonCount > thirdPersonCount * 2) povConsistency = 'first'
  else if (thirdPersonCount > firstPersonCount * 3) povConsistency = 'third_limited'

  return {
    avgSentenceLength: Math.round(avgLen),
    sentenceLengthVariance: Math.round(variance),
    paragraphLength: Math.round(avgParaLen),
    dialogueRatio: Math.round(dialogueRatio * 100) / 100,
    adjectiveDensity: Math.round(adjDensity * 100) / 100,
    commonWords,
    sentenceStarters,
    actionBeatFrequency: Math.round(actionFreq * 10) / 10,
    povConsistency
  }
}

function emptyProfile(): StyleProfile {
  return {
    avgSentenceLength: 0, sentenceLengthVariance: 0, paragraphLength: 0,
    dialogueRatio: 0, adjectiveDensity: 0, commonWords: [], sentenceStarters: [],
    actionBeatFrequency: 0, povConsistency: 'third_limited'
  }
}

export function compareStyleProfiles(a: StyleProfile, b: StyleProfile): string[] {
  const notes: string[] = []
  if (Math.abs(a.avgSentenceLength - b.avgSentenceLength) > 15) {
    notes.push(`句子长度差异较大 (${a.avgSentenceLength} vs ${b.avgSentenceLength}字)`)
  }
  if (Math.abs(a.dialogueRatio - b.dialogueRatio) > 0.2) {
    notes.push(`对话占比差异明显 (${Math.round(a.dialogueRatio * 100)}% vs ${Math.round(b.dialogueRatio * 100)}%)`)
  }
  if (Math.abs(a.actionBeatFrequency - b.actionBeatFrequency) > 5) {
    notes.push(`动作密度不同 (${a.actionBeatFrequency} vs ${b.actionBeatFrequency}/千字)`)
  }
  return notes
}
