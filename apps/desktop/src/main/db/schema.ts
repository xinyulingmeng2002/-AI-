// SQLite 数据库 schema — Truth Files 持久化存储

export const SCHEMA_SQL = `
-- 作品表
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  genre TEXT NOT NULL DEFAULT '',
  one_liner TEXT DEFAULT '',
  cover_path TEXT DEFAULT '',
  status TEXT DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 人物表
CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- 伏笔表
CREATE TABLE IF NOT EXISTS pending_hooks (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  description TEXT NOT NULL,
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- 章节摘要表
CREATE TABLE IF NOT EXISTS chapter_summaries (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  volume_number INTEGER NOT NULL DEFAULT 1,
  chapter_number INTEGER NOT NULL,
  title TEXT DEFAULT '',
  data_json TEXT NOT NULL DEFAULT '{}',
  content TEXT DEFAULT '',
  word_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- 章纲要表
CREATE TABLE IF NOT EXISTS chapter_outlines (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- 世界观状态表
CREATE TABLE IF NOT EXISTS world_state (
  workspace_id TEXT PRIMARY KEY,
  data_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- 支线表
CREATE TABLE IF NOT EXISTS subplots (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- 资源账本表
CREATE TABLE IF NOT EXISTS resource_ledger (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- 动态模块表
CREATE TABLE IF NOT EXISTS dynamic_modules (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  module_name TEXT NOT NULL,
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_characters_ws ON characters(workspace_id);
CREATE INDEX IF NOT EXISTS idx_hooks_ws ON pending_hooks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_chapters_ws ON chapter_summaries(workspace_id);
CREATE INDEX IF NOT EXISTS idx_subplots_ws ON subplots(workspace_id);
CREATE INDEX IF NOT EXISTS idx_modules_ws ON dynamic_modules(workspace_id);

-- FTS5 全文搜索虚拟表（用于 RAG 关键词检索）
CREATE VIRTUAL TABLE IF NOT EXISTS chapters_fts USING fts5(
  chunk_id,
  content,
  chapter_id,
  volume_number,
  chapter_number,
  workspace_id,
  tokenize='unicode61'
);
`
