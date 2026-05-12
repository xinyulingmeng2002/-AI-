// 章节版本管理 — Copy-on-Write 快照

import type { ChapterOutline } from '@mindforge/shared'

export interface ChapterVersion {
  id: string; chapterId: string; version: number
  content: string; outline: ChapterOutline | null
  createdAt: string; label: string
}

/** 创建版本快照 */
export async function createVersion(
  chapterId: string, content: string, outline: ChapterOutline | null, label = ''
): Promise<void> {
  const versionId = `ver_${chapterId}_${Date.now()}`
  await window.mindforge.db.insert('dynamic_modules', {
    workspace_id: chapterId, // 复用字段
    module_name: label || `v${outline?.version ?? 0}`,
    data_json: JSON.stringify({
      _type: 'chapter_version',
      chapterId, content: content.slice(0, 50000), // 限制大小
      outline, version: outline?.version ?? 0,
      label: label || `自动保存 ${new Date().toLocaleString('zh-CN')}`,
      createdAt: new Date().toISOString()
    })
  })
}

/** 获取章节版本列表 */
export async function getVersions(chapterId: string): Promise<ChapterVersion[]> {
  try {
    const result = await window.mindforge.db.getAll('dynamic_modules', chapterId)
    if (result.success && result.data) {
      return (result.data as Record<string, unknown>[])
        .filter((r) => {
          const data = JSON.parse((r.data_json as string) || '{}')
          return data._type === 'chapter_version' && data.chapterId === chapterId
        })
        .map((r) => {
          const data = JSON.parse((r.data_json as string) || '{}')
          return {
            id: r.id as string, chapterId: data.chapterId as string,
            version: data.version as number, content: data.content as string,
            outline: data.outline as ChapterOutline | null,
            createdAt: data.createdAt as string, label: data.label as string
          }
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
  } catch { /* ignore */ }
  return []
}

/** 恢复版本 */
export async function restoreVersion(version: ChapterVersion): Promise<void> {
  await window.mindforge.db.update('chapter_summaries', version.chapterId, {
    content: version.content,
    data_json: JSON.stringify(version.outline ?? {}),
    updated_at: new Date().toISOString()
  })
}
