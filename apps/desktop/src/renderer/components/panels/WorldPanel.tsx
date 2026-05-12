import { useEffect, useState } from 'react'
import { useWorkspaceStore } from '@/stores/workspace'
import { Globe, MapPin, Shield, BookOpen } from 'lucide-react'

interface WorldModule {
  id: string
  name: string
  category: string
  description: string
}

export function WorldPanel() {
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)
  const [modules, setModules] = useState<WorldModule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentWorkspaceId) { setLoading(false); return }
    loadModules()
  }, [currentWorkspaceId])

  const loadModules = async () => {
    try {
      const result = await window.mindforge.db.getAll('dynamic_modules', currentWorkspaceId!)
      if (result.success && result.data) {
        setModules(
          (result.data as Record<string, unknown>[]).map((r) => {
            const data = JSON.parse((r.data_json as string) || '{}')
            return {
              id: r.id as string,
              name: (r.module_name as string) || (r.name as string),
              category: data.category || '其他',
              description: data.description || ''
            }
          })
        )
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  if (loading) return <div className="text-white/20 text-[11px] text-center py-8">加载中...</div>

  if (modules.length === 0) {
    return (
      <div className="text-white/20 text-[11px] text-center py-8 leading-relaxed px-4">
        世界观要素为空<br />
        在智能交流中枢中聊天时，<br />
        提取的势力/地点/规则会自动出现在这里
      </div>
    )
  }

  const categoryIcons: Record<string, React.ReactNode> = {
    '势力': <Shield size={11} />,
    '地点': <MapPin size={11} />,
    '世界规则': <BookOpen size={11} />
  }

  const byCategory = modules.reduce<Record<string, WorldModule[]>>((acc, m) => {
    (acc[m.category] ??= []).push(m)
    return acc
  }, {})

  return (
    <div className="p-2 space-y-2 overflow-y-auto h-full">
      {Object.entries(byCategory).map(([category, items]) => (
        <div key={category}>
          <div className="text-[10px] text-white/30 px-1 mb-1 flex items-center gap-1">
            {categoryIcons[category] ?? <Globe size={11} />}
            {category} ({items.length})
          </div>
          {items.map((item) => (
            <div key={item.id} className="px-2 py-1.5 rounded hover:bg-white/5 text-xs text-white/60">
              <div className="font-medium truncate">{item.name}</div>
              {item.description && (
                <div className="text-[10px] text-white/30 truncate mt-0.5">{item.description.slice(0, 60)}</div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
