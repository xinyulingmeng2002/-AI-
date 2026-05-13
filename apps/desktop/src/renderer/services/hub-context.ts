// 中枢动态上下文组装器 — 让AI实时了解作品全貌

import { useCharacterStore } from '@/stores/characters'
import { useOutlineStore } from '@/stores/outline'
import { useWorkspaceStore } from '@/stores/workspace'

export interface HubContext {
  systemPrompt: string
  summary: string
}

/** 从作品当前状态组装动态系统提示 */
export async function buildHubContext(workspaceId: string, identity: string): Promise<HubContext> {
  const parts: string[] = []
  const summaryParts: string[] = []

  // 1. 作品基本信息
  const ws = useWorkspaceStore.getState().workspaces.find(w => w.id === workspaceId)
  if (ws) {
    parts.push(`## 作品信息\n- 名称：${ws.title}\n- 类型：${ws.genre}\n- 简介：${ws.oneLiner || '暂无'}`)
    summaryParts.push(`作品「${ws.title}」(${ws.genre})`)
  }

  // 2. 大纲结构
  const volumes = useOutlineStore.getState().volumes
  if (volumes.length > 0) {
    let outlineText = '\n## 当前大纲结构\n'
    for (const vol of volumes) {
      outlineText += `\n### ${vol.title}(${vol.chapters.length}章)\n`
      for (const ch of vol.chapters.slice(0, 10)) {
        outlineText += `- 第${ch.chapterNumber}章 ${ch.title} (${ch.wordCount}字, ${ch.status})\n`
        if (ch.outline?.objective.mainlineProgress) {
          outlineText += `  目标：${ch.outline.objective.mainlineProgress.slice(0, 80)}\n`
        }
      }
      if (vol.chapters.length > 10) outlineText += `  ... 共${vol.chapters.length}章\n`
    }
    parts.push(outlineText)
    summaryParts.push(`${volumes.length}卷${volumes.reduce((s, v) => s + v.chapters.length, 0)}章`)
  } else {
    parts.push('\n## 当前大纲\n（尚未创建大纲结构）')
  }

  // 3. 人物档案
  const characters = useCharacterStore.getState().characters
  if (characters.length > 0) {
    let charText = '\n## 现有人物\n'
    for (const c of characters) {
      charText += `- **${c.name}**`
      if (c.archetype) charText += ` (${c.archetype})`
      if (c.personality?.motivation) charText += ` — ${c.personality.motivation.slice(0, 60)}`
      if (c.currentState?.status && c.currentState.status !== 'alive') charText += ` [${c.currentState.status}]`
      charText += '\n'
    }
    parts.push(charText)
    summaryParts.push(`${characters.length}个人物`)
  }

  // 4. 从数据库加载世界观/伏笔/词条摘要
  try {
    const hooks = await window.mindforge.db.getAll('pending_hooks', workspaceId)
    if (hooks.success && hooks.data && hooks.data.length > 0) {
      let hookText = '\n## 当前伏笔状态\n'
      const pending = (hooks.data as Record<string, unknown>[]).filter(r => {
        const d = JSON.parse((r.data_json as string) || '{}')
        return d.status === 'pending'
      })
      const recovered = (hooks.data as Record<string, unknown>[]).filter(r => {
        const d = JSON.parse((r.data_json as string) || '{}')
        return d.status === 'recovered'
      })
      hookText += `- 待回收：${pending.length}个\n- 已回收：${recovered.length}个\n`
      if (pending.length > 0) {
        hookText += '- 待回收列表：\n'
        pending.slice(0, 5).forEach(h => {
          const d = JSON.parse((h.data_json as string) || '{}')
          hookText += `  - ${(h.description as string)?.slice(0, 60) ?? d.description?.slice(0, 60)}\n`
        })
      }
      parts.push(hookText)
      summaryParts.push(`${pending.length}个待回收伏笔`)
    }
  } catch { /* ignore */ }

  // 5. 世界观模块
  try {
    const modules = await window.mindforge.db.getAll('dynamic_modules', workspaceId)
    if (modules.success && modules.data && modules.data.length > 0) {
      const worldModules = (modules.data as Record<string, unknown>[]).filter(r => {
        const d = JSON.parse((r.data_json as string) || '{}')
        return d._type !== 'timeline' && d._type !== 'glossary' && d._type !== 'chapter_version'
      })
      if (worldModules.length > 0) {
        let worldText = '\n## 世界观要素\n'
        const byCat: Record<string, string[]> = {}
        for (const m of worldModules) {
          const d = JSON.parse((m.data_json as string) || '{}')
          const cat = (d.category as string) || '其他'
          if (!byCat[cat]) byCat[cat] = []
          byCat[cat].push((m.module_name as string) || (d.name as string) || '')
        }
        for (const [cat, names] of Object.entries(byCat)) {
          worldText += `- ${cat}：${names.slice(0, 5).join('、')}\n`
        }
        parts.push(worldText)
        summaryParts.push(`${worldModules.length}个世界观要素`)
      }
    }
  } catch { /* ignore */ }

  // 6. 智能引导策略（基于缺失要素）
  const missingItems: string[] = []
  if (!ws?.oneLiner) missingItems.push('一句话简介')
  if (volumes.length === 0) missingItems.push('大纲结构')
  if (characters.length === 0) missingItems.push('人物设定')
  if (characters.length > 0 && !characters.some(c => c.personality?.motivation)) missingItems.push('人物动机')
  if (characters.length > 0 && !characters.some(c => c.archetype)) missingItems.push('人物原型')

  let guidanceText = ''
  if (missingItems.length > 0) {
    guidanceText = `\n## 当前最需要完善的要素\n${missingItems.map((item, i) => `${i + 1}. ${item}`).join('\n')}\n\n请在聊天中自然地引导作者完善这些要素。不要直接列出清单，而是在对话中恰到好处地引入相关话题。`
  } else {
    guidanceText = '\n## 引导策略\n作品基础要素已较为完善。请关注深度挖掘：人物关系的复杂性、世界观的内在逻辑一致性、伏笔的布局与回收节奏。'
  }

  const identityGuides: Record<string, string> = {
    sister: '你是一位温柔、善解人意的写作伙伴。语气亲切温暖，多用"～"和"哦"。鼓励为主，建议为辅。',
    brother: '你是一位幽默轻松的写作搭子。语气自在随意，像朋友聊天。能快速抓住要点，给直接的建议。',
    mentor: '你是一位资深文学导师。专业严谨，从叙事结构、人物弧光、节奏把控等维度给出深度建议。'
  }

  const systemPrompt = `${identityGuides[identity] ?? identityGuides.sister}

你是心御AI小说辅助器的智能中枢。你能实时看到作者的作品全貌，包括大纲、人物、世界观、伏笔等所有要素。

${parts.join('\n')}
${guidanceText}

## 重要规则
1. 你是朋友，不是工具。用自然聊天的方式交流，不要说"根据系统显示..."等机械表达。
2. 每次聊天中提取到的要素（人物/地点/事件/伏笔等），系统会自动更新到对应模块。
3. 当作者分享新想法时，主动帮ta思考与现有设定的一致性。
4. 发现设定冲突时，温和地指出，并给出协调建议。
5. 根据当前缺失的要素，自然地引导对话方向。但不要穷追不舍，尊重作者的创作节奏。`

  return {
    systemPrompt,
    summary: summaryParts.join('，')
  }
}
