import { useEffect, useState } from 'react'
import { useWorkspaceStore } from '@/stores/workspace'
import { Link, AlertTriangle, CheckCircle2, Clock, Trash2 } from 'lucide-react'
import { EmptyState, LoadingText } from '@/components/shared/Loading'

interface HookItem {
  id: string
  description: string
  importance: string
  status: string
}

const STATUS_OPTIONS = [
  { value: 'pending', label: '待回收', icon: <Clock size={10} className="text-yellow-400" /> },
  { value: 'partially_recovered', label: '部分回收', icon: <AlertTriangle size={10} className="text-orange-400" /> },
  { value: 'recovered', label: '已回收', icon: <CheckCircle2 size={10} className="text-green-400" /> },
  { value: 'abandoned', label: '已废弃', icon: <Clock size={10} className="text-white/20" /> }
]

const IMPORTANCE_COLORS: Record<string, string> = {
  critical: 'border-l-red-400',
  major: 'border-l-yellow-400',
  minor: 'border-l-white/20'
}

const IMPORTANCE_LABELS: Record<string, string> = {
  critical: '重要', major: '中等', minor: '次要'
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
    if (!currentWorkspaceId) return
    try {
      const result = await window.mindforge.db.getAll('pending_hooks', currentWorkspaceId)
      if (result.success && result.data) {
        setHooks((result.data as Record<string, unknown>[]).map((r) => {
          const data = JSON.parse((r.data_json as string) || '{}')
          return {
            id: r.id as string,
            description: (r.description as string) || data.description || '',
            importance: data.importance || 'minor',
            status: data.status || 'pending'
          }
        }))
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  const updateStatus = async (hook: HookItem, newStatus: string) => {
    const data = { description: hook.description, importance: hook.importance, status: newStatus }
    await window.mindforge.db.update('pending_hooks', hook.id, {
      data_json: JSON.stringify(data)
    })
    loadHooks()
  }

  const removeHook = async (id: string) => {
    await window.mindforge.db.delete('pending_hooks', id)
    loadHooks()
  }

  if (loading) return <LoadingText />
  if (hooks.length === 0) {
    return <EmptyState>暂无伏笔记录。在智能交流中枢或章纲要中设定的伏笔会自动出现在这里。</EmptyState>
  }

  const recovered = hooks.filter((h) => h.status === 'recovered').length

  const overdueCritical = hooks.filter((h) => h.importance === 'critical' && h.status === 'pending')
  const overdueMajor = hooks.filter((h) => h.importance === 'major' && h.status === 'pending')

  return (
    <div className="p-2 space-y-1.5 overflow-y-auto h-full">
      {/* 逾期提醒 */}
      {(overdueCritical.length > 0 || overdueMajor.length > 0) && (
        <div className="bg-red-400/5 border border-red-400/20 rounded-lg p-2 text-[10px] mb-2">
          <div className="text-red-400/80 font-medium mb-1">[注意] 伏笔提醒</div>
          {overdueCritical.length > 0 && (
            <div className="text-red-400/60">[严重] {overdueCritical.length} 个重要伏笔尚未回收</div>
          )}
          {overdueMajor.length > 0 && (
            <div className="text-yellow-400/60">[警告] {overdueMajor.length} 个中等伏笔待处理</div>
          )}
        </div>
      )}

      {hooks.map((hook) => {
        const currentStatus = STATUS_OPTIONS.find((s) => s.value === hook.status)
        return (
          <div key={hook.id}
            className={`border border-white/[0.06] rounded-lg py-1.5 px-2 hover:bg-white/[0.03] text-xs group ${
              hook.importance === 'critical' ? 'bg-red-400/[0.03]' :
              hook.importance === 'major' ? 'bg-yellow-400/[0.02]' : ''
            }`}>
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                {currentStatus?.icon}
                <span className={`text-[9px] px-1 py-0.5 rounded shrink-0 ${
                  hook.importance === 'critical' ? 'text-red-400 bg-red-400/10' :
                  hook.importance === 'major' ? 'text-yellow-400 bg-yellow-400/10' :
                  'text-white/20 bg-white/5'
                }`}>{IMPORTANCE_LABELS[hook.importance]}</span>
                {/* 状态下拉 */}
                <select
                  className="bg-transparent text-[9px] text-white/30 rounded border border-white/5 px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  value={hook.status}
                  onChange={(e) => updateStatus(hook, e.target.value)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => removeHook(hook.id)}
                className="btn-ghost p-0.5 opacity-0 group-hover:opacity-100 hover:text-red-400 shrink-0"
              >
                <Trash2 size={9} />
              </button>
            </div>
            <p className="mt-1 text-white/50 leading-relaxed line-clamp-2 text-[11px]">{hook.description}</p>
          </div>
        )
      })}
      <div className="text-[10px] text-white/20 pt-2 text-center">
        共 {hooks.length} 个 · {recovered} 个已回收
      </div>
    </div>
  )
}
