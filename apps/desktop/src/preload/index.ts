import { contextBridge, ipcRenderer } from 'electron'

// 向渲染进程暴露安全的 API
contextBridge.exposeInMainWorld('mindforge', {
  // 数据库操作
  db: {
    insert: (table: string, data: Record<string, unknown>) =>
      ipcRenderer.invoke('db:insert', table, data),
    update: (table: string, id: string, data: Record<string, unknown>) =>
      ipcRenderer.invoke('db:update', table, id, data),
    getOne: (table: string, id: string) =>
      ipcRenderer.invoke('db:getOne', table, id),
    getAll: (table: string, workspaceId: string) =>
      ipcRenderer.invoke('db:getAll', table, workspaceId),
    delete: (table: string, id: string) =>
      ipcRenderer.invoke('db:delete', table, id),
    deleteByWorkspace: (table: string, workspaceId: string) =>
      ipcRenderer.invoke('db:deleteByWorkspace', table, workspaceId)
  },

  // 作品管理
  workspace: {
    create: (data: Record<string, unknown>) =>
      ipcRenderer.invoke('workspace:create', data),
    list: () => ipcRenderer.invoke('workspace:list'),
    update: (id: string, data: Record<string, unknown>) =>
      ipcRenderer.invoke('workspace:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('workspace:delete', id)
  },

  // 文件操作
  readFile: (path: string) => ipcRenderer.invoke('fs:readFile', path),
  writeFile: (path: string, content: string) => ipcRenderer.invoke('fs:writeFile', path, content),
  readDir: (path: string) => ipcRenderer.invoke('fs:readDir', path),
  mkdir: (path: string) => ipcRenderer.invoke('fs:mkdir', path),

  // 应用信息
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  getPlatform: () => process.platform,

  // 安全存储（API Key等）
  secureStore: {
    get: (key: string) => ipcRenderer.invoke('secure:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('secure:set', key, value),
    delete: (key: string) => ipcRenderer.invoke('secure:delete', key)
  }
})

export type MindforgeAPI = typeof window.mindforge
