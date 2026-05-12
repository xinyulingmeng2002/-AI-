// 数据备份服务

export async function createBackup(): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    // @ts-expect-error - backup:create is registered in main process
    return await window.mindforge.backup?.create?.() ?? {
      success: false, error: '备份功能不可用'
    }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function getDbPath(): Promise<string> {
  try {
    // @ts-expect-error - dynamic IPC channel
    const result = await window.mindforge.backup?.getDbPath?.()
    return result as string ?? ''
  } catch {
    return ''
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
