// 要素提取 Pipeline 类型定义

export type ExtractionIntent =
  | 'world_building'   // 世界观构建
  | 'character_detail' // 人物细节
  | 'plot_idea'        // 剧情构思
  | 'foreshadowing'    // 伏笔埋设
  | 'revision'         // 修改/修正
  | 'question'         // 提问
  | 'chat'             // 纯闲聊

export type EntityCategory =
  | 'character'
  | 'location'
  | 'item'
  | 'ability'
  | 'faction'
  | 'rule'
  | 'event'
  | 'relationship'
  | 'timeline'
  | 'foreshadowing_hook'

export interface ExtractedEntity {
  id: string
  category: EntityCategory
  name: string
  value: string
  confidence: number     // 0-1
  relatedModules: string[]
}

export interface ExtractionRelation {
  type: 'new' | 'update' | 'supplement' | 'conflict'
  entityId: string
  existingId: string | null  // 关联的现有实体ID
  description: string
}

export interface ExtractionResult {
  intent: ExtractionIntent
  entities: ExtractedEntity[]
  relations: ExtractionRelation[]
  summary: string           // AI 对本次提取内容的自然语言总结
  suggestedQuestions?: string[]  // AI 建议追问的问题
}

// 提取卡片展示数据
export interface ExtractionCard {
  id: string
  timestamp: string
  summary: string
  entities: Array<{
    category: EntityCategory
    name: string
    value: string
    relation: 'new' | 'update' | 'supplement' | 'conflict'
  }>
  suggestedQuestions: string[]
  confirmed: boolean
}

export const ENTITY_CATEGORY_LABELS: Record<EntityCategory, string> = {
  character: '人物',
  location: '地点',
  item: '物品',
  ability: '能力/功法',
  faction: '势力/组织',
  rule: '世界规则',
  event: '事件',
  relationship: '关系',
  timeline: '时间节点',
  foreshadowing_hook: '伏笔'
}
