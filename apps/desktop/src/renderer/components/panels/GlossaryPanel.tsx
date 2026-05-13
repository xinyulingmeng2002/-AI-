import { useEffect, useState } from 'react'
import { useWorkspaceStore } from '@/stores/workspace'
import { onHubEvent } from '@/services/hub-events'
import { BookMarked, Plus, Trash2, Edit3, Check, X, Search } from 'lucide-react'
import { EmptyState, LoadingText } from '@/components/shared/Loading'

interface GlossaryTerm {
  id: string; name: string; category: string; definition: string
}

const DEFAULT_CATEGORIES = ['功法', '丹药', '地名', '称号', '种族', '物品', '组织', '其他']

export function GlossaryPanel() {
  const currentWsId = useWorkspaceStore((s) => s.currentWorkspaceId)
  const [terms, setTerms] = useState<GlossaryTerm[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState(''); const [newCat, setNewCat] = useState('功法'); const [newDef, setNewDef] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState(''); const [editCat, setEditCat] = useState(''); const [editDef, setEditDef] = useState('')
  const [filterCat, setFilterCat] = useState<string | null>(null)

  useEffect(() => { if (!currentWsId) { setLoading(false); return }; loadTerms() }, [currentWsId])

  const loadTerms = async () => {
    if (!currentWsId) return
    try {
      const result = await window.mindforge.db.getAll('dynamic_modules', currentWsId)
      if (result.success && result.data) {
        setTerms((result.data as Record<string, unknown>[])
          .filter((r) => {
            const data = JSON.parse((r.data_json as string) || '{}')
            return data._type === 'glossary'
          })
          .map((r) => {
            const data = JSON.parse((r.data_json as string) || '{}')
            return { id: r.id as string, name: (r.module_name as string) || data.name || '',
              category: data.category || '其他', definition: data.definition || '' }
          })
          .sort((a, b) => a.name.localeCompare(b.name))
        )
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  const addTerm = async () => {
    if (!newName.trim() || !currentWsId) return
    await window.mindforge.db.insert('dynamic_modules', {
      workspace_id: currentWsId, module_name: newName.trim(),
      data_json: JSON.stringify({ name: newName.trim(), category: newCat, definition: newDef.trim(), _type: 'glossary' })
    })
    setNewName(''); setNewDef(''); setAdding(false); loadTerms()
  }

  const saveEdit = async () => {
    if (!editingId) return
    await window.mindforge.db.update('dynamic_modules', editingId, {
      module_name: editName,
      data_json: JSON.stringify({ name: editName, category: editCat, definition: editDef, _type: 'glossary' })
    })
    setEditingId(null); loadTerms()
  }

  const removeTerm = async (id: string) => { await window.mindforge.db.delete('dynamic_modules', id); loadTerms() }

  if (loading) return <LoadingText />

  const filtered = search
    ? terms.filter((t) => t.name.includes(search) || t.definition.includes(search) || t.category.includes(search))
    : filterCat ? terms.filter((t) => t.category === filterCat) : terms

  // 统计分类
  const categories = [...new Set(terms.map((t) => t.category))]

  return (
    <div className="h-full flex flex-col">
      {/* 搜索+过滤 */}
      <div className="px-2 pt-2 space-y-1.5">
        <div className="relative">
          <Search size={11} className="absolute left-2 top-1.5 text-white/20" />
          <input className="input-field text-[11px] pl-6 py-1" placeholder="搜索词条..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setFilterCat(null)}
            className={`text-[9px] px-1.5 py-0.5 rounded ${!filterCat ? 'bg-accent-primary/20 text-accent-primary' : 'text-white/30 hover:text-white/50'}`}>
            全部({terms.length})
          </button>
          {categories.map((c) => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`text-[9px] px-1.5 py-0.5 rounded ${filterCat === c ? 'bg-accent-primary/20 text-accent-primary' : 'text-white/30 hover:text-white/50'}`}>
              {c}({terms.filter((t) => t.category === c).length})
            </button>
          ))}
        </div>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {adding && (
          <div className="bg-surface-lighter rounded-lg p-2 space-y-1">
            <div className="flex gap-1">
              <input className="input-field text-[11px] flex-1 py-0.5" placeholder="词条名..." value={newName}
                onChange={(e) => setNewName(e.target.value)} autoFocus />
              <select className="input-field text-[10px] w-20 py-0.5" value={newCat} onChange={(e) => setNewCat(e.target.value)}>
                {DEFAULT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <input className="input-field text-[10px] w-full py-0.5" placeholder="定义..." value={newDef} onChange={(e) => setNewDef(e.target.value)} />
            <div className="flex gap-1">
              <button onClick={addTerm} className="btn-primary text-[10px] px-2">添加</button>
              <button onClick={() => setAdding(false)} className="btn-ghost text-[10px]">取消</button>
            </div>
          </div>
        )}

        {filtered.length === 0 && !adding ? (
          <EmptyState>{search ? '无匹配词条' : '词条字典为空。点击 + 添加第一个术语定义。'}</EmptyState>
        ) : (
          filtered.map((term) => (
            <div key={term.id} className="bg-surface-lighter rounded-lg p-2 group">
              {editingId === term.id ? (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    <input className="input-field text-[11px] flex-1 py-0.5" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
                    <select className="input-field text-[10px] w-20 py-0.5" value={editCat} onChange={(e) => setEditCat(e.target.value)}>
                      {DEFAULT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <input className="input-field text-[10px] w-full py-0.5" value={editDef} onChange={(e) => setEditDef(e.target.value)} />
                  <div className="flex gap-1">
                    <button onClick={saveEdit} className="btn-ghost p-0.5 text-green-400"><Check size={10} /></button>
                    <button onClick={() => setEditingId(null)} className="btn-ghost p-0.5"><X size={10} /></button>
                  </div>
                </div>
              ) : (
                <div onDoubleClick={() => { setEditingId(term.id); setEditName(term.name); setEditCat(term.category); setEditDef(term.definition) }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] text-accent-primary/50 px-1 py-0.5 bg-accent-primary/5 rounded">{term.category}</span>
                      <span className="text-xs text-white/70 font-medium truncate">{term.name}</span>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex gap-0.5">
                      <button onClick={() => { setEditingId(term.id); setEditName(term.name); setEditCat(term.category); setEditDef(term.definition) }}
                        className="btn-ghost p-0.5"><Edit3 size={9} /></button>
                      <button onClick={() => removeTerm(term.id)} className="btn-ghost p-0.5 hover:text-red-400"><Trash2 size={9} /></button>
                    </div>
                  </div>
                  {term.definition && <div className="text-[10px] text-white/30 mt-0.5">{term.definition}</div>}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 底部添加按钮 */}
      {!adding && (
        <div className="p-2 border-t border-white/5">
          <button onClick={() => { setAdding(true); setNewName(''); setNewDef('') }}
            className="text-[10px] text-accent-primary/60 hover:text-accent-primary w-full text-center">+ 添加词条</button>
        </div>
      )}
    </div>
  )
}
