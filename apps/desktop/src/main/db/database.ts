// 数据库初始化与管理

import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { SCHEMA_SQL } from './schema'

let db: Database.Database | null = null

export function getDbPath(): string {
  const userDataPath = app.getPath('userData')
  return join(userDataPath, 'mindforge.db')
}

export function initDatabase(): Database.Database {
  if (db) return db

  const dbPath = getDbPath()
  db = new Database(dbPath)

  // 启用 WAL 模式提升并发性能
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // 执行建表
  db.exec(SCHEMA_SQL)

  return db
}

export function getDatabase(): Database.Database {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.')
  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

// 表名白名单 — 防止SQL注入
const ALLOWED_TABLES = new Set([
  'workspaces', 'characters', 'pending_hooks', 'chapter_summaries',
  'chapter_outlines', 'world_state', 'subplots', 'resource_ledger',
  'dynamic_modules', 'chat_history', 'app_settings', 'chapters_fts'
])

function validateTable(table: string): void {
  if (!ALLOWED_TABLES.has(table)) {
    throw new Error(`Invalid table name: ${table}`)
  }
}

// ---------- 通用 CRUD 操作 ----------

export function insertOne(table: string, data: Record<string, unknown>): void {
  validateTable(table)
  const db = getDatabase()
  const keys = Object.keys(data)
  const placeholders = keys.map(() => '?').join(', ')
  const values = keys.map((k) => data[k])

  const stmt = db.prepare(
    `INSERT OR REPLACE INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`
  )
  stmt.run(...values)
}

export function updateOne(table: string, id: string, data: Record<string, unknown>): void {
  validateTable(table)
  const db = getDatabase()
  const sets = Object.keys(data).map((k) => `${k} = ?`).join(', ')
  const values = Object.values(data)

  const stmt = db.prepare(
    `UPDATE ${table} SET ${sets}, updated_at = datetime('now') WHERE id = ?`
  )
  stmt.run(...values, id)
}

export function getOne(table: string, id: string): Record<string, unknown> | null {
  validateTable(table)
  const db = getDatabase()
  const stmt = db.prepare(`SELECT * FROM ${table} WHERE id = ?`)
  return (stmt.get(id) as Record<string, unknown>) ?? null
}

export function getAll(table: string, workspaceId: string): Record<string, unknown>[] {
  validateTable(table)
  const db = getDatabase()
  const stmt = db.prepare(`SELECT * FROM ${table} WHERE workspace_id = ? ORDER BY created_at ASC`)
  return stmt.all(workspaceId) as Record<string, unknown>[]
}

export function deleteOne(table: string, id: string): void {
  validateTable(table)
  const db = getDatabase()
  const stmt = db.prepare(`DELETE FROM ${table} WHERE id = ?`)
  stmt.run(id)
}

/** 按 workspace_id 删除所有关联数据 */
export function deleteByWorkspace(table: string, workspaceId: string): void {
  validateTable(table)
  const db = getDatabase()
  const stmt = db.prepare(`DELETE FROM ${table} WHERE workspace_id = ?`)
  stmt.run(workspaceId)
}
