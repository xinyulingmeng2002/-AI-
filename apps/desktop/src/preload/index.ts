import { contextBridge, ipcRenderer } from 'electron'

// 向渲染进程暴露安全的 API
contextBridge.exposeInMainWorld('mindforge', {
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
