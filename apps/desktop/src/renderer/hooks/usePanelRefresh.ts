import { useEffect, useRef } from 'react'
import { onHubEvent } from '@/services/hub-events'

/** 面板数据加载 + 中枢事件自动刷新 */
export function usePanelRefresh(
  workspaceId: string | null,
  loadFn: () => Promise<void>
) {
  const loadRef = useRef(loadFn)
  loadRef.current = loadFn

  // 初始加载
  useEffect(() => {
    if (!workspaceId) return
    loadRef.current()
  }, [workspaceId])

  // 监听中枢事件自动刷新
  useEffect(() => {
    return onHubEvent((event) => {
      if (event.type === 'extraction:applied' || event.type === 'module:edited') {
        loadRef.current()
      }
    })
  }, [])
}
