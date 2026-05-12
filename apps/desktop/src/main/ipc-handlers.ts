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
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('db:update', (_e, table: string, id: string, data: Record<string, unknown>) => {
    try {
      updateOne(table, id, data)
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('db:getOne', (_e, table: string, id: string) => {
    try {
      const result = getOne(table, id)
      return { success: true, data: result }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('db:getAll', (_e, table: string, workspaceId: string) => {
    try {
      const results = getAll(table, workspaceId)
      return { success: true, data: results }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('db:delete', (_e, table: string, id: string) => {
    try {
      deleteOne(table, id)
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('db:deleteByWorkspace', (_e, table: string, workspaceId: string) => {
    try {
      deleteByWorkspace(table, workspaceId)
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
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
      return { success: false, error: (err as Error).message }
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
      return { success: false, error: (err as Error).message }
    }
  })

  // 更新作品
  ipcMain.handle('workspace:update', (_e, id: string, data: Record<string, unknown>) => {
    try {
      updateOne('workspaces', id, data)
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  // 删除作品及其所有关联数据
  ipcMain.handle('workspace:delete', (_e, id: string) => {
    try {
      const tables = [
        'characters', 'pending_hooks', 'chapter_summaries', 'chapter_outlines',
        'world_state', 'subplots', 'resource_ledger', 'dynamic_modules'
      ]
      for (const table of tables) {
        deleteByWorkspace(table, id)
      }
      deleteOne('workspaces', id)
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
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

export function registerAllHandlers() {
  initDatabase()
  registerDbHandlers()
  registerWorkspaceHandlers()
  registerBackupHandlers()
}
