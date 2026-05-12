// 聊天服务 — 桥接模型配置 Store 与核心模型路由器

import type { ChatMessage, TaskType } from '@mindforge/core'
import { createRouter } from '@mindforge/core'
import { useModelConfigStore } from '@/stores/model-config'

let routerInstance: ReturnType<typeof createRouter> | null = null

function getRouter() {
  const store = useModelConfigStore.getState()
  const configs = store.toCoreConfigs()
  const defaultId = store.defaultModelId

  if (configs.length === 0) {
    throw new Error('请先在设置中配置模型')
  }

  if (!routerInstance) {
    routerInstance = createRouter(configs, defaultId)
  } else {
    routerInstance.updateConfig({
      models: new Map(configs.map((c) => [c.id, c])),
      defaultModelId: defaultId,
      taskMappings: new Map(
        Object.entries(store.taskMappings).map(([k, v]) => [k as TaskType, v])
      )
    })
  }

  return routerInstance
}

export interface StreamCallback {
  onToken: (token: string) => void
  onDone: (fullContent: string) => void
  onError: (error: Error) => void
}

export async function sendChatMessage(
  messages: ChatMessage[],
  callbacks: StreamCallback
): Promise<void> {
  try {
    const router = getRouter()
    let fullContent = ''

    for await (const chunk of router.streamChat('chat', messages)) {
      if (chunk.content) {
        fullContent += chunk.content
        callbacks.onToken(chunk.content)
      }
      if (chunk.done) {
        callbacks.onDone(fullContent)
        return
      }
    }

    callbacks.onDone(fullContent)
  } catch (e) {
    callbacks.onError(e as Error)
  }
}

/** 清除路由器缓存（模型配置变更时调用） */
export function clearRouterCache() {
  routerInstance = null
}
