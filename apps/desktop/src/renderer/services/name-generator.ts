// 随机起名生成器 — 支持本地词库和AI增强

import { createRouter, PROVIDER_PRESETS, type ModelConfig } from '@mindforge/core'
import { useModelConfigStore } from '@/stores/model-config'

export type NameCategory = 'character_male' | 'character_female' | 'faction' | 'place' | 'technique' | 'item'

const CATEGORY_LABELS: Record<NameCategory, string> = {
  character_male: '男性角色',
  character_female: '女性角色',
  faction: '势力/宗门',
  place: '地名',
  technique: '功法/技能',
  item: '法宝/丹药'
}

// 本地词库兜底
const LOCAL_NAMES: Record<NameCategory, string[]> = {
  character_male: ['云逸', '萧然', '楚天阔', '凌霄', '墨渊', '风无极', '龙辰', '沈清寒', '白子画', '夜无殇'],
  character_female: ['苏婉清', '柳如烟', '慕容雪', '林月瑶', '花千骨', '碧落', '秦可卿', '凤九歌', '云韵', '叶倾城'],
  faction: ['天剑宗', '星辰殿', '万妖谷', '太虚门', '灵霄阁', '九幽宫', '青云宗', '龙渊府', '碧游宫', '幻海阁'],
  place: ['苍澜大陆', '玄冥山脉', '落霞峰', '忘川河', '九重天', '无妄海', '蓬莱仙岛', '幽冥深渊', '太初古矿', '琅琊秘境'],
  technique: ['九转玄功', '太虚剑诀', '焚天诀', '万剑归宗', '混沌炼体术', '星辰变', '六道轮回拳', '大衍术', '一气化三清', '降龙十八掌'],
  item: ['诛仙剑', '乾坤鼎', '混沌钟', '九天玄铁', '万年冰蚕丝', '凤凰羽', '龙魂珠', '破界符', '聚灵丹', '天雷竹']
}

/** 本地随机生成 */
export function generateLocalNames(category: NameCategory, count = 5): string[] {
  const pool = LOCAL_NAMES[category] ?? LOCAL_NAMES.character_male
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

/** AI增强生成 */
export async function generateAINames(
  category: NameCategory,
  count = 5,
  context = ''
): Promise<string[]> {
  const store = useModelConfigStore.getState()
  const configs = store.toCoreConfigs()
  if (configs.length === 0) {
    return generateLocalNames(category, count)
  }

  const router = createRouter(configs, store.defaultModelId)
  const prompt = `你是一位精通中文命名的大师。请为${CATEGORY_LABELS[category]}生成${count}个富有文化底蕴的名字。

${context ? `上下文参考：${context}` : ''}

要求：
- 每个名字2-4个汉字
- 名字要有意境和文化感
- 适合用在玄幻/仙侠小说中
- 每个名字一行，不要编号`

  try {
    const response = await router.chat('chat', [
      { role: 'system', content: '你是专业的命名大师，只返回名字列表，不要多余文字。' },
      { role: 'user', content: prompt }
    ])
    const names = response.content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length >= 2 && line.length <= 5 && !line.startsWith('#'))
      .slice(0, count)

    return names.length > 0 ? names : generateLocalNames(category, count)
  } catch {
    return generateLocalNames(category, count)
  }
}

export const CATEGORY_OPTIONS = (Object.entries(CATEGORY_LABELS) as [NameCategory, string][]).map(
  ([value, label]) => ({ value, label })
)
