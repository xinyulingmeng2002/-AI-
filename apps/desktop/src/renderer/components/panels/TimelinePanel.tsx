import { useEffect, useState } from 'react'
import { useWorkspaceStore } from '@/stores/workspace'
import { Clock, Plus, Trash2, Edit3, Check, X } from 'lucide-react'
import { EmptyState, LoadingText } from '@/components/shared/Loading'

interface TimelineEvent {
  id: string
  name: string
  description: string
  chapterNumber: number | null
  order: number
}

export function TimelinePanel() {
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')

  useEffect(() => {
    if (!currentWorkspaceId) { setLoading(false); return }
    loadEvents()
  }, [currentWorkspaceId])

  const loadEvents = async () => {
    if (!currentWorkspaceId) return
    try {
      const result = await window.mindforge.db.getAll('dynamic_modules', currentWorkspaceId)
      if (result.success && result.data) {
        const timelineEvents = (result.data as Record<string, unknown>[])
          .filter((r) => {
            const data = JSON.parse((r.data_json as string) || '{}')
            return data._type === 'timeline'
          })
          .map((r) => {
            const data = JSON.parse((r.data_json as string) || '{}')
            return {
              id: r.id as string,
              name: (r.module_name as string) || data.name || '',
              description: data.description || '',
              chapterNumber: data.chapterNumber as number | null,
              order: data.order as number ?? 0
            }
          })
          .sort((a, b) => a.order - b.order)
        setEvents(timelineEvents)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  const addEvent = async () => {
    if (!newName.trim() || !currentWorkspaceId) return
    await window.mindforge.db.insert('dynamic_modules', {
      workspace_id: currentWorkspaceId,
      module_name: newName.trim(),
      data_json: JSON.stringify({
        name: newName.trim(),
        description: newDesc.trim(),
        chapterNumber: null,
        order: events.length,
        _type: 'timeline'
      })
    })
    setNewName(''); setNewDesc(''); setAdding(false)
    loadEvents()
  }

  const updateEvent = async (event: TimelineEvent) => {
    await window.mindforge.db.update('dynamic_modules', event.id, {
      data_json: JSON.stringify({
        name: editName,
        description: editDesc,
        chapterNumber: event.chapterNumber,
        order: event.order,
        _type: 'timeline'
      })
    })
    setEditingId(null)
    loadEvents()
  }

  const removeEvent = async (id: string) => {
    await window.mindforge.db.delete('dynamic_modules', id)
    loadEvents()
  }

  if (loading) return <LoadingText />
  if (events.length === 0 && !adding) {
    return (
      <div className="h-full flex flex-col">
        <EmptyState>时间线记录作品中的关键事件顺序。在智能交流中枢中提及时间节点时会自动提取。</EmptyState>
        <div className="px-3 pb-3">
          <button onClick={() => setAdding(true)}
            className="text-[10px] text-accent-primary/60 hover:text-accent-primary w-full text-center">
            + 添加事件
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-2 space-y-1 overflow-y-auto h-full">
      {events.map((event, i) => (
        <div key={event.id} className="flex gap-2 items-start group">
          {/* 时间线竖条 */}
          <div className="flex flex-col items-center shrink-0 pt-1">
            <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-accent-primary' : 'bg-white/20'}`} />
            {i < events.length - 1 && <div className="w-px flex-1 bg-white/5 my-0.5" />}
          </div>

          {/* 事件内容 */}
          <div className="flex-1 min-w-0 pb-3">
            {editingId === event.id ? (
              <div className="space-y-1">
                <input className="input-field text-[11px] w-full py-0.5" value={editName}
                  onChange={(e) => setEditName(e.target.value)} autoFocus />
                <input className="input-field text-[10px] w-full py-0.5" value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)} placeholder="描述..." />
                <div className="flex gap-1">
                  <button onClick={() => setEditingId(null)} className="btn-ghost p-0.5"><X size={10} /></button>
                  <button onClick={() => updateEvent(event)} className="btn-ghost p-0.5 text-green-400"><Check size={10} /></button>
                </div>
              </div>
            ) : (
              <div onDoubleClick={() => { setEditingId(event.id); setEditName(event.name); setEditDesc(event.description) }}
                className="rounded px-1.5 py-1 hover:bg-white/5 cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/70 font-medium">{event.name}</span>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-0.5">
                    <button onClick={() => { setEditingId(event.id); setEditName(event.name); setEditDesc(event.description) }}
                      className="btn-ghost p-0.5"><Edit3 size={9} /></button>
                    <button onClick={() => removeEvent(event.id)} className="btn-ghost p-0.5 hover:text-red-400"><Trash2 size={9} /></button>
                  </div>
                </div>
                {event.description && (
                  <div className="text-[10px] text-white/30 mt-0.5 line-clamp-2">{event.description}</div>
                )}
                {event.chapterNumber && (
                  <span className="text-[9px] text-accent-primary/40 mt-1 inline-block">第{event.chapterNumber}章</span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      {adding ? (
        <div className="flex gap-2 items-start pl-3">
          <div className="w-2 h-2 rounded-full bg-accent-secondary mt-1.5 shrink-0" />
          <div className="flex-1 space-y-1">
            <input className="input-field text-[11px] w-full py-0.5" placeholder="事件名称..."
              value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
            <input className="input-field text-[10px] w-full py-0.5" placeholder="描述（可选）..."
              value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            <div className="flex gap-1">
              <button onClick={addEvent} className="btn-primary text-[10px] px-2">添加</button>
              <button onClick={() => setAdding(false)} className="btn-ghost text-[10px]">取消</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="pl-3">
          <button onClick={() => setAdding(true)}
            className="text-[10px] text-accent-primary/60 hover:text-accent-primary">+ 添加事件</button>
        </div>
      )}
    </div>
  )
}
