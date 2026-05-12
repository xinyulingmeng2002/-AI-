// 应用级设置持久化服务

export async function saveSetting(key: string, value: string): Promise<void> {
  try {
    await window.mindforge.db.insert('app_settings', { key, value })
  } catch {
    try { await window.mindforge.db.update('app_settings', key, { value }) } catch { /* ignore */ }
  }
}

export async function loadSetting(key: string): Promise<string | null> {
  try {
    const result = await window.mindforge.db.getOne('app_settings', key)
    if (result.success && result.data) {
      return (result.data as Record<string, unknown>).value as string
    }
  } catch { /* ignore */ }
  return null
}
