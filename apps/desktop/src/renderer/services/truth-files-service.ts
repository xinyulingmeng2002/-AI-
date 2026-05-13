// Truth Files 写入服务 — 从提取卡片到数据库

import { emitHubEvent } from './hub-events'
import type { ExtractionCard, EntityCategory } from '@mindforge/core'
import { useCharacterStore, createDefaultCharacter } from '@/stores/characters'
import { useWorkspaceStore } from '@/stores/workspace'

export async function applyExtractionCard(
  card: ExtractionCard,
  workspaceId: string
): Promise<{ success: boolean; summary: string }> {
  const results: string[] = []

  for (const entity of card.entities) {
    try {
      const action = await applyEntity(entity.category, entity.name, entity.value, entity.relation, workspaceId)
      if (action) results.push(action)
    } catch (err) {
      console.error(`Failed to apply entity ${entity.name}:`, err)
    }
  }

  // 广播事件，通知所有面板刷新
  emitHubEvent('extraction:applied', { results })
  return {
    success: true,
    summary: results.length > 0 ? results.join('；') : '要素已同步'
  }
}

async function applyEntity(
  category: EntityCategory,
  name: string,
  value: string,
  relation: string,
  workspaceId: string
): Promise<string | null> {
  switch (category) {
    case 'character': {
      // 写入人物表
      if (relation === 'new') {
        const char = createDefaultCharacter(name)
        // 尝试从 value 中提取更多信息
        if (value.includes('性格')) {
          char.personality.motivation = value
        }
        char.background = value

        const result = await window.mindforge.db.insert('characters', {
          id: char.id,
          workspace_id: workspaceId,
          name: char.name,
          data_json: JSON.stringify(char)
        })

        if (result.success) {
          // 同步到本地 Store
          useCharacterStore.getState().addCharacter(name)
        }
        return `新增人物「${name}」`
      }
      return `更新人物「${name}」`
    }

    case 'faction':
    case 'rule':
    case 'location': {
      // 写入动态模块表
      const moduleName = category === 'faction' ? '势力' : category === 'rule' ? '世界规则' : '地点'
      const result = await window.mindforge.db.insert('dynamic_modules', {
        workspace_id: workspaceId,
        module_name: moduleName,
        data_json: JSON.stringify({ name, description: value, category })
      })
      return result.success ? `新增${moduleName}「${name}」` : null
    }

    case 'foreshadowing_hook': {
      const result = await window.mindforge.db.insert('pending_hooks', {
        workspace_id: workspaceId,
        description: value,
        data_json: JSON.stringify({
          description: value,
          plantedChapter: null,
          importance: 'major',
          status: 'pending'
        })
      })
      return result.success ? `新增伏笔「${name}」` : null
    }

    case 'item':
    case 'ability': {
      const result = await window.mindforge.db.insert('resource_ledger', {
        workspace_id: workspaceId,
        name,
        data_json: JSON.stringify({
          name,
          type: category === 'item' ? '物品' : '能力',
          description: value
        })
      })
      return result.success ? `新增${category === 'item' ? '物品' : '能力'}「${name}」` : null
    }

    default:
      return null
  }
}

/** 获取工作空间的所有要素摘要（用于提取器的现有设定摘要） */
export async function getExistingSummary(workspaceId: string): Promise<string> {
  try {
    const parts: string[] = []

    const chars = await window.mindforge.db.getAll('characters', workspaceId)
    if (chars.success && chars.data && chars.data.length > 0) {
      parts.push(`已有人物(${chars.data.length})：${chars.data.map((r: Record<string, unknown>) => r.name).join('、')}`)
    }

    const hooks = await window.mindforge.db.getAll('pending_hooks', workspaceId)
    if (hooks.success && hooks.data && hooks.data.length > 0) {
      parts.push(`已有伏笔(${hooks.data.length})：${hooks.data.map((r: Record<string, unknown>) => (r.data_json as string)?.slice(0, 50) ?? r.description).join('、')}`)
    }

    return parts.join('\n')
  } catch {
    return ''
  }
}
