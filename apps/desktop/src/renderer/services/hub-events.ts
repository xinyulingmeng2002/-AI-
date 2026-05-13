// 中枢事件系统 — 连接所有模块与智能交流中枢

export type HubEventType =
  | 'extraction:applied'     // 提取要素已写入DB
  | 'module:edited'          // 用户编辑了某个模块
  | 'module:deleted'         // 用户删除了某个模块条目
  | 'outline:changed'        // 大纲结构变化
  | 'character:changed'      // 人物档案变化
  | 'chapter:saved'          // 章节保存

export interface HubEvent {
  type: HubEventType
  payload: Record<string, unknown>
  timestamp: string
}

/** 触发中枢事件 */
export function emitHubEvent(type: HubEventType, payload: Record<string, unknown> = {}) {
  window.dispatchEvent(new CustomEvent('hub-event', {
    detail: { type, payload, timestamp: new Date().toISOString() }
  }))
}

/** 监听中枢事件 */
export function onHubEvent(handler: (event: HubEvent) => void) {
  const listener = (e: Event) => handler((e as CustomEvent).detail as HubEvent)
  window.addEventListener('hub-event', listener)
  return () => window.removeEventListener('hub-event', listener)
}
