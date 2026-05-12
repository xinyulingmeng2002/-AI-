import { useEffect, useState } from 'react'
import { useWorkspaceStore } from '@/stores/workspace'
import { Link, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'

interface HookItem {
  id: string
  description: string
  importance: string
  status: string
  plantedChapter: number | null
}

export function HooksPanel() {
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)
  const [hooks, setHooks] = useState<HookItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentWorkspaceId) { setLoading(false); return }
    loadHooks()
  }, [currentWorkspaceId])

  const loadHooks = async () => {
    try {
      const result = await window.mindforge.db.getAll('pending_hooks', currentWorkspaceId!)
      if (result.success && result.data) {
        setHooks(
          (result.data as Record<string, unknown>[]).map((r) => {
            const data = JSON.parse((r.data_json as string) || '{}')
            return {
              id: r.id as string,
              description: (r.description as string) || data.description || '',
              importance: data.importance || 'minor',
              status: data.status || 'pending',
              plantedChapter: data.plantedChapter as number | null
            }
          })
        )
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  if (loading) return <div className="text-white/20 text-[11px] text-center py-8">加载中...</div>

  if (hooks.length === 0) {
    return (
      <div className="text-white/20 text-[11px] text-center py-8 leading-relaxed px-4">
        暂无伏笔记录<br />
        在智能交流中枢或章纲要中<br />
        设定的伏笔会自动出现在这里
      </div>
    )
  }

  const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock size={10} className="text-yellow-400" />,
    partially_recovered: <AlertTriangle size={10} className="text-orange-400" />,
    recovered: <CheckCircle2 size={10} className="text-green-400" />,
    abandoned: <Clock size={10} className="text-white/20" />
  }

  const importanceColors: Record<string, string> = {
    critical: 'border-l-red-400',
    major: 'border-l-yellow-400',
    minor: 'border-l-white/20'
  }

  return (
    <div className="p-2 space-y-1 overflow-y-auto h-full">
      {hooks.map((hook) => (
        <div
          key={hook.id}
          className={`border-l-2 ${importanceColors[hook.importance] ?? 'border-l-white/10'}
                      pl-2 py-1.5 rounded-r hover:bg-white/5 text-xs`}
        >
          <div className="flex items-center gap-1.5 text-white/60">
            {statusIcons[hook.status]}
            <span className={`text-[10px] px-1 py-0.5 rounded ${
              hook.importance === 'critical' ? 'text-red-400 bg-red-400/10' :
              hook.importance === 'major' ? 'text-yellow-400 bg-yellow-400/10' :
              'text-white/20 bg-white/5'
            }`}>
              {hook.importance === 'critical' ? '重要' : hook.importance === 'major' ? '中等' : '次要'}
            </span>
          </div>
          <p className="mt-1 text-white/50 leading-relaxed line-clamp-2">{hook.description}</p>
        </div>
      ))}
      <div className="text-[10px] text-white/20 pt-2 text-center">
        共 {hooks.length} 个伏笔 · {hooks.filter((h) => h.status === 'recovered').length} 个已回收
      </div>
    </div>
  )
}
