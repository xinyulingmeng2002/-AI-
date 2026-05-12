import { useEffect, useState } from 'react'
import { useWorkspaceStore } from '@/stores/workspace'
import { GitBranch, Plus, Trash2, Edit3, Check, X, AlertTriangle, CheckCircle2, Circle } from 'lucide-react'
import { EmptyState, LoadingText } from '@/components/shared/Loading'

interface SubplotItem {
  id: string; name: string; description: string
  status: 'planned' | 'active' | 'resolved' | 'abandoned'
  progress: number; relatedCharacters: string[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  planned:  { label: '计划中', color: 'text-white/30',  icon: <Circle size={10} /> },
  active:   { label: '进行中', color: 'text-blue-400',   icon: <Circle size={10} className="text-blue-400" /> },
  resolved: { label: '已解决', color: 'text-green-400',  icon: <CheckCircle2 size={10} className="text-green-400" /> },
  abandoned:{ label: '已废弃', color: 'text-white/20',  icon: <Circle size={10} /> }
}

export function SubplotPanel() {
  const currentWsId = useWorkspaceStore((s) => s.currentWorkspaceId)
  const [subplots, setSubplots] = useState<SubplotItem[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')

  useEffect(() => { if (!currentWsId) { setLoading(false); return }; loadSubplots() }, [currentWsId])

  const loadSubplots = async () => {
    if (!currentWsId) return
    try {
      const result = await window.mindforge.db.getAll('subplots', currentWsId)
      if (result.success && result.data) {
        setSubplots((result.data as Record<string, unknown>[]).map((r) => {
          const data = JSON.parse((r.data_json as string) || '{}')
          return { id: r.id as string, name: r.name as string, description: data.description || '',
            status: data.status || 'planned', progress: data.progress ?? 0,
            relatedCharacters: data.relatedCharacters ?? [] }
        }))
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  const addSubplot = async () => {
    if (!newName.trim() || !currentWsId) return
    await window.mindforge.db.insert('subplots', {
      workspace_id: currentWsId, name: newName.trim(),
      data_json: JSON.stringify({ description: '', status: 'planned', progress: 0, relatedCharacters: [] })
    })
    setNewName(''); setAdding(false); loadSubplots()
  }

  const updateSubplot = async (id: string, partial: Partial<SubplotItem>) => {
    await window.mindforge.db.update('subplots', id, {
      data_json: JSON.stringify({ description: partial.description || editDesc, status: partial.status || 'planned', progress: partial.progress ?? 0 })
    })
    setEditingId(null); loadSubplots()
  }

  const removeSubplot = async (id: string) => { await window.mindforge.db.delete('subplots', id); loadSubplots() }

  if (loading) return <LoadingText />
  const active = subplots.filter((s) => s.status === 'active').length
  const resolved = subplots.filter((s) => s.status === 'resolved').length

  return (
    <div className="p-2 space-y-2 overflow-y-auto h-full">
      <div className="text-[10px] text-white/30 flex justify-between px-1">
        <span>{subplots.length} 条支线 · {active} 进行中 · {resolved} 已解决</span>
        <button onClick={() => setAdding(true)}><Plus size={11} /></button>
      </div>

      {adding && (
        <div className="flex gap-1">
          <input className="input-field text-[11px] flex-1 py-1" placeholder="支线名称..." value={newName}
            onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addSubplot(); if (e.key === 'Escape') setAdding(false) }} autoFocus />
          <button onClick={addSubplot} className="btn-primary text-[10px] px-2">添加</button>
        </div>
      )}

      {subplots.length === 0 && !adding && (
        <EmptyState>暂无支线。Observer会在章节保存时自动提取支线线索。</EmptyState>
      )}

      {subplots.map((sp) => {
        const sc = STATUS_CONFIG[sp.status]
        return (
          <div key={sp.id} className="bg-surface-lighter rounded-lg p-2 group">
            {editingId === sp.id ? (
              <div className="space-y-1">
                <input className="input-field text-[11px] w-full py-0.5" value={editName}
                  onChange={(e) => setEditName(e.target.value)} autoFocus />
                <input className="input-field text-[10px] w-full py-0.5" value={editDesc} placeholder="描述..."
                  onChange={(e) => setEditDesc(e.target.value)} />
                <div className="flex gap-1">
                  <select className="input-field text-[10px] w-24 py-0.5" value={sp.status}
                    onChange={(e) => updateSubplot(sp.id, { status: e.target.value as SubplotItem['status'] })}>
                    <option value="planned">计划中</option>
                    <option value="active">进行中</option>
                    <option value="resolved">已解决</option>
                    <option value="abandoned">已废弃</option>
                  </select>
                  <button onClick={() => updateSubplot(sp.id, {})} className="btn-ghost p-0.5 text-green-400"><Check size={10} /></button>
                  <button onClick={() => setEditingId(null)} className="btn-ghost p-0.5"><X size={10} /></button>
                </div>
              </div>
            ) : (
              <div onDoubleClick={() => { setEditingId(sp.id); setEditName(sp.name); setEditDesc(sp.description) }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {sc.icon}
                    <span className={`text-xs font-medium truncate ${sc.color}`}>{sp.name}</span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-0.5">
                    <button onClick={() => { setEditingId(sp.id); setEditName(sp.name); setEditDesc(sp.description) }}
                      className="btn-ghost p-0.5"><Edit3 size={9} /></button>
                    <button onClick={() => removeSubplot(sp.id)} className="btn-ghost p-0.5 hover:text-red-400"><Trash2 size={9} /></button>
                  </div>
                </div>
                {sp.description && <div className="text-[10px] text-white/30 mt-0.5 line-clamp-2">{sp.description}</div>}
                <div className="mt-1.5 bg-white/5 rounded-full h-1 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${sp.progress >= 100 ? 'bg-green-400' : 'bg-accent-primary'}`}
                    style={{ width: `${sp.progress}%` }} />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
