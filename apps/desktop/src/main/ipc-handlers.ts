// IPC 处理注册 — 主进程与渲染进程的桥梁

import { ipcMain, app, dialog } from 'electron'
import {
  initDatabase, getDatabase, getDbPath,
  insertOne, updateOne, getOne, getAll, deleteOne, deleteByWorkspace
} from './db/database'
import { randomUUID } from 'crypto'
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'

// ---------- 数据库操作 ----------

function registerDbHandlers() {
  ipcMain.handle('db:insert', (_e, table: string, data: Record<string, unknown>) => {
    try {
      if (!data.id) data.id = randomUUID()
      insertOne(table, data)
      return { success: true, id: data.id }
    } catch (err) {
      return { success: false, error: "Internal error" }
    }
  })

  ipcMain.handle('db:update', (_e, table: string, id: string, data: Record<string, unknown>) => {
    try {
      updateOne(table, id, data)
      return { success: true }
    } catch (err) {
      return { success: false, error: "Internal error" }
    }
  })

  ipcMain.handle('db:getOne', (_e, table: string, id: string) => {
    try {
      const result = getOne(table, id)
      return { success: true, data: result }
    } catch (err) {
      return { success: false, error: "Internal error" }
    }
  })

  ipcMain.handle('db:getAll', (_e, table: string, workspaceId: string) => {
    try {
      const results = getAll(table, workspaceId)
      return { success: true, data: results }
    } catch (err) {
      return { success: false, error: "Internal error" }
    }
  })

  ipcMain.handle('db:delete', (_e, table: string, id: string) => {
    try {
      deleteOne(table, id)
      return { success: true }
    } catch (err) {
      return { success: false, error: "Internal error" }
    }
  })

  ipcMain.handle('db:deleteByWorkspace', (_e, table: string, workspaceId: string) => {
    try {
      deleteByWorkspace(table, workspaceId)
      return { success: true }
    } catch (err) {
      return { success: false, error: "Internal error" }
    }
  })
}

// ---------- 作品管理 ----------

function registerWorkspaceHandlers() {
  // 创建作品
  ipcMain.handle('workspace:create', (_e, data: Record<string, unknown>) => {
    try {
      if (!data.id) data.id = randomUUID()
      insertOne('workspaces', data)

      // 初始化空的世界观状态
      insertOne('world_state', {
        workspace_id: data.id,
        data_json: JSON.stringify({
          geography: [],
          factions: [],
          powerSystem: { name: '', description: '', stages: [], rules: [] },
          rules: [],
          history: [],
          currentState: { activeConflicts: [], politicalSituation: '', economicSituation: '' }
        })
      })

      return { success: true, id: data.id }
    } catch (err) {
      return { success: false, error: "Internal error" }
    }
  })

  // 获取所有作品
  ipcMain.handle('workspace:list', () => {
    try {
      const db = getDatabase()
      const stmt = db.prepare('SELECT * FROM workspaces ORDER BY updated_at DESC')
      const results = stmt.all()
      return { success: true, data: results }
    } catch (err) {
      return { success: false, error: "Internal error" }
    }
  })

  // 更新作品
  ipcMain.handle('workspace:update', (_e, id: string, data: Record<string, unknown>) => {
    try {
      updateOne('workspaces', id, data)
      return { success: true }
    } catch (err) {
      return { success: false, error: "Internal error" }
    }
  })

  // 删除作品及其所有关联数据
  ipcMain.handle('workspace:delete', (_e, id: string) => {
    try {
      const tables = [
        'characters', 'pending_hooks', 'chapter_summaries', 'chapter_outlines',
        'world_state', 'subplots', 'resource_ledger', 'dynamic_modules', 'chat_history'
      ]
      for (const table of tables) {
        deleteByWorkspace(table, id)
      }
      deleteOne('workspaces', id)
      return { success: true }
    } catch (err) {
      return { success: false, error: "Internal error" }
    }
  })
}

function registerBackupHandlers() {
  ipcMain.handle('backup:create', async () => {
    try {
      const result = await dialog.showSaveDialog({
        title: '备份数据库',
        defaultPath: `mindforge-backup-${new Date().toISOString().slice(0, 10)}.db`,
        filters: [{ name: 'SQLite数据库', extensions: ['db'] }]
      })
      if (result.canceled || !result.filePath) {
        return { success: false, error: '已取消' }
      }
      const dbPath = getDbPath()
      const backupDir = dirname(result.filePath)
      if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true })
      copyFileSync(dbPath, result.filePath)
      return { success: true, path: result.filePath }
    } catch (e) {
      return { success: false, error: (e as Error).message }
    }
  })

  ipcMain.handle('app:getDbPath', () => getDbPath())
  ipcMain.handle('app:version', () => app.getVersion())
}

// 安全存储（内存中，Electron safeStorage API）
const secureStore = new Map<string, string>()

function registerFsHandlers() {
  const fs = require('fs')
  ipcMain.handle('fs:readFile', (_e, path: string) => {
    try { return fs.readFileSync(path, 'utf-8') } catch { return null }
  })
  ipcMain.handle('fs:writeFile', (_e, path: string, content: string) => {
    try { fs.writeFileSync(path, content, 'utf-8'); return true } catch { return false }
  })
  ipcMain.handle('fs:readDir', (_e, path: string) => {
    try { return fs.readdirSync(path) } catch { return [] }
  })
  ipcMain.handle('fs:mkdir', (_e, path: string) => {
    try { fs.mkdirSync(path, { recursive: true }); return true } catch { return false }
  })
}

function registerSecureHandlers() {
  ipcMain.handle('secure:get', (_e, key: string) => secureStore.get(key) ?? null)
  ipcMain.handle('secure:set', (_e, key: string, value: string) => { secureStore.set(key, value) })
  ipcMain.handle('secure:delete', (_e, key: string) => { secureStore.delete(key) })
}

export function registerAllHandlers() {
  initDatabase()
  registerDbHandlers()
  registerWorkspaceHandlers()
  registerBackupHandlers()
  registerFsHandlers()
  registerSecureHandlers()
}
