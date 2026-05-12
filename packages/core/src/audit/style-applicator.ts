// 风格应用引擎 — 从提取到生成

import type { StyleProfile } from './style-engine'

export function buildStylePrompt(profile: StyleProfile): string {
  const parts: string[] = ['## 写作风格要求\n请严格按照以下风格参数写作：']

  parts.push(`- 平均句子长度：${profile.avgSentenceLength}字左右（方差${profile.sentenceLengthVariance}）`)
  parts.push(`- 段落长度：约${profile.paragraphLength}字`)
  parts.push(`- 对话占比：约${Math.round(profile.dialogueRatio * 100)}%`)
  parts.push(`- 形容词密度：${profile.adjectiveDensity.toFixed(1)}%（偏低→简洁有力，偏高→细腻描写）`)

  if (profile.povConsistency === 'first') {
    parts.push('- 视角：第一人称（"我"的视角），内心独白为主')
  } else {
    parts.push('- 视角：第三人称有限视角，跟随主角的所见所感')
  }

  if (profile.actionBeatFrequency > 5) {
    parts.push(`- 动作密度：高（${profile.actionBeatFrequency}/千字），多用动作驱动叙事`)
  } else {
    parts.push('- 动作密度：适中，动作与描写平衡')
  }

  if (profile.commonWords.length > 0) {
    parts.push(`- 常用词汇特征：${profile.commonWords.slice(0, 10).join('、')}`)
  }

  if (profile.sentenceStarters.length > 0) {
    parts.push(`- 句式开头特征：${profile.sentenceStarters.slice(0, 5).join('、')}`)
  }

  parts.push('\n请在保持上述风格参数的前提下进行创作。不要刻意模仿某个具体作者的语调，而是自然地融入这些参数所描述的风格倾向。')

  return parts.join('\n')
}

/** 快捷风格预设 */
export const STYLE_PRESETS: Record<string, { name: string; description: string; profile: Partial<StyleProfile> }> = {
  'fast_paced': {
    name: '快节奏爽文',
    description: '短句、高密度动作、低描写占比',
    profile: { avgSentenceLength: 20, actionBeatFrequency: 8, dialogueRatio: 0.3, adjectiveDensity: 1.5 }
  },
  'detailed': {
    name: '细腻描写风',
    description: '长句、丰富形容词、环境渲染',
    profile: { avgSentenceLength: 45, actionBeatFrequency: 3, dialogueRatio: 0.25, adjectiveDensity: 3.5 }
  },
  'dialogue_heavy': {
    name: '对话驱动',
    description: '大量对话推进剧情',
    profile: { avgSentenceLength: 25, actionBeatFrequency: 4, dialogueRatio: 0.45, adjectiveDensity: 2.0 }
  },
  'balanced': {
    name: '均衡叙事',
    description: '对话/描写/动作均衡分布',
    profile: { avgSentenceLength: 30, actionBeatFrequency: 5, dialogueRatio: 0.3, adjectiveDensity: 2.5 }
  }
}
