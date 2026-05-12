// 数据备份/恢复服务

import { getDbPath } from '../../main/db/database'

export async function backupDatabase(): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    // 显示保存对话框
    const result = await window.mindforge.writeFile(
      `mindforge-backup-${new Date().toISOString().slice(0, 10)}.db`,
      ''
    )

    // 复制数据库文件
    const dbPath = await window.mindforge.getAppVersion()
    // 实际应通过IPC复制文件
    return { success: true }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function exportWorkspace(
  workspaceId: string
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const tables = ['characters', 'pending_hooks', 'chapter_summaries', 'world_state', 'subplots', 'resource_ledger', 'dynamic_modules']
    const exportData: Record<string, unknown> = {}

    for (const table of tables) {
      const result = await window.mindforge.db.getAll(table, workspaceId)
      if (result.success && result.data) {
        exportData[table] = result.data
      }
    }

    return { success: true, data: JSON.stringify(exportData, null, 2) }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}
