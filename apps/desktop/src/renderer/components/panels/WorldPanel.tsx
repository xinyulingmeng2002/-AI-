import { useEffect, useState } from 'react'
import { useWorkspaceStore } from '@/stores/workspace'
import { emitHubEvent, onHubEvent } from '@/services/hub-events'
import { Globe, MapPin, Shield, BookOpen, Trash2, Edit3, Check, X, Plus } from 'lucide-react'
import { EmptyState, LoadingText } from '@/components/shared/Loading'

interface WorldModule {
  id: string
  name: string
  category: string
  description: string
}

const CATEGORIES = ['势力', '地点', '世界规则', '其他']
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  '势力': <Shield size={11} />,
  '地点': <MapPin size={11} />,
  '世界规则': <BookOpen size={11} />,
  '其他': <Globe size={11} />
}

export function WorldPanel() {
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)
  const [modules, setModules] = useState<WorldModule[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [addingCategory, setAddingCategory] = useState<string | null>(null)
  const [newItemName, setNewItemName] = useState('')

  useEffect(() => {
    if (!currentWorkspaceId) { setLoading(false); return }
    loadModules()
  }, [currentWorkspaceId])

  const loadModules = async () => {
    if (!currentWorkspaceId) return
    try {
      const result = await window.mindforge.db.getAll('dynamic_modules', currentWorkspaceId)
      if (result.success && result.data) {
        setModules((result.data as Record<string, unknown>[]).map((r) => {
          const data = JSON.parse((r.data_json as string) || '{}')
          return {
            id: r.id as string,
            name: (r.module_name as string) || (r.name as string) || '',
            category: data.category || '其他',
            description: data.description || ''
          }
        }))
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  const startEdit = (m: WorldModule) => {
    setEditingId(m.id)
    setEditName(m.name)
    setEditDesc(m.description)
  }

  const saveEdit = async () => {
    if (!editingId) return
    await window.mindforge.db.update('dynamic_modules', editingId, {
      module_name: editName,
      data_json: JSON.stringify({ name: editName, description: editDesc, category: modules.find(m => m.id === editingId)?.category })
    })
    setEditingId(null)
    emitHubEvent('module:edited', { module: `世界观/${editName}` })
    loadModules()
  }

  const removeItem = async (id: string) => {
    await window.mindforge.db.delete('dynamic_modules', id)
    loadModules()
  }

  const addItem = async (category: string) => {
    if (!newItemName.trim() || !currentWorkspaceId) return
    await window.mindforge.db.insert('dynamic_modules', {
      workspace_id: currentWorkspaceId,
      module_name: newItemName.trim(),
      data_json: JSON.stringify({ name: newItemName.trim(), description: '', category })
    })
    setNewItemName('')
    setAddingCategory(null)
    emitHubEvent('module:edited', { module: `世界观/${newItemName.trim()}` })
    loadModules()
  }

  if (loading) return <LoadingText />
  if (modules.length === 0 && !addingCategory) {
    return <EmptyState>在智能交流中枢中聊天时，提取的势力/地点/规则会自动出现。也可以点击下方按钮手动添加。</EmptyState>
  }

  const byCategory = modules.reduce<Record<string, WorldModule[]>>((acc, m) => {
    (acc[m.category] ??= []).push(m)
    return acc
  }, {})

  return (
    <div className="p-2 space-y-3 overflow-y-auto h-full">
      {CATEGORIES.map((category) => {
        const items = byCategory[category] ?? []
        if (items.length === 0 && addingCategory !== category) return null
        return (
          <div key={category}>
            <div className="text-[10px] text-white/30 px-1 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                {CATEGORY_ICONS[category]} {category}
              </span>
              <button onClick={() => setAddingCategory(category)} className="hover:text-white/60">
                <Plus size={11} />
              </button>
            </div>

            {addingCategory === category && (
              <div className="flex gap-1 px-1 mb-1">
                <input className="input-field text-[10px] flex-1 py-1" placeholder="名称..."
                  value={newItemName} onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addItem(category); if (e.key === 'Escape') setAddingCategory(null) }}
                  autoFocus />
                <button onClick={() => addItem(category)} className="btn-primary text-[10px] px-2">添加</button>
              </div>
            )}

            {items.map((item) => (
              <div key={item.id} className="px-2 py-1 rounded hover:bg-white/5 group text-xs">
                {editingId === item.id ? (
                  <div className="space-y-1">
                    <input className="input-field text-[11px] w-full py-0.5" value={editName}
                      onChange={(e) => setEditName(e.target.value)} autoFocus />
                    <input className="input-field text-[10px] w-full py-0.5" value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)} placeholder="描述（可选）..." />
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => setEditingId(null)} className="btn-ghost p-0.5"><X size={10} /></button>
                      <button onClick={saveEdit} className="btn-ghost p-0.5 text-green-400"><Check size={10} /></button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0" onDoubleClick={() => startEdit(item)}>
                      <div className="font-medium truncate text-white/60">{item.name}</div>
                      {item.description && (
                        <div className="text-[10px] text-white/25 truncate mt-0.5">{item.description.slice(0, 60)}</div>
                      )}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex gap-0.5">
                      <button onClick={() => startEdit(item)} className="btn-ghost p-0.5"><Edit3 size={9} /></button>
                      <button onClick={() => removeItem(item.id)} className="btn-ghost p-0.5 hover:text-red-400"><Trash2 size={9} /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      })}

      {/* 添加按钮区 */}
      {!addingCategory && (
        <div className="flex flex-wrap gap-1 pt-1">
          {CATEGORIES.filter(c => !byCategory[c] || addingCategory !== c).map(c => (
            <button key={c} onClick={() => { setAddingCategory(c); setNewItemName('') }}
              className="text-[10px] text-white/20 hover:text-white/50 px-2 py-1 rounded border border-white/5 hover:border-white/10">
              + {c}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
