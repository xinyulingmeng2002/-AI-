import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkspaceStore, type WorkspaceInfo } from '@/stores/workspace'
import { BookOpen, Plus, Trash2, Edit3, ChevronRight, Library, Loader2 } from 'lucide-react'

function CreateWorkspaceModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('玄幻')
  const [oneLiner, setOneLiner] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace)
  const navigate = useNavigate()

  const genres = ['玄幻', '都市', '科幻', '悬疑', '言情', '仙侠', '武侠', '历史', '游戏', '轻小说']

  const handleCreate = async () => {
    if (!title.trim()) return
    setSubmitting(true)
    const id = await createWorkspace({
      title: title.trim(),
      genre,
      oneLiner: oneLiner.trim()
    })
    setSubmitting(false)
    if (id) {
      onClose()
      navigate(`/wizard/${id}`)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-surface border border-white/10 rounded-xl p-6 w-[520px] shadow-2xl">
        <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
          <BookOpen size={18} className="text-accent-primary" />
          创建新作品
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50 block mb-1">作品名称 *</label>
            <input
              className="input-field text-sm"
              placeholder="给你的作品起个名字..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs text-white/50 block mb-1">类型</label>
            <div className="flex flex-wrap gap-2">
              {genres.map((g) => (
                <button
                  key={g}
                  onClick={() => setGenre(g)}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors
                    ${genre === g
                      ? 'border-accent-primary text-accent-primary bg-accent-primary/10'
                      : 'border-white/10 text-white/50 hover:border-white/20'
                    }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-white/50 block mb-1">一句话简介</label>
            <input
              className="input-field text-sm"
              placeholder="用一句话介绍你的故事..."
              value={oneLiner}
              onChange={(e) => setOneLiner(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="btn-ghost text-sm">取消</button>
          <button
            onClick={handleCreate}
            disabled={!title.trim() || submitting}
            className="btn-primary text-sm flex items-center gap-1"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
            创建并开始
          </button>
        </div>
      </div>
    </div>
  )
}

function WorkspaceCard({ ws, onEnter, onDelete }: {
  ws: WorkspaceInfo
  onEnter: () => void
  onDelete: () => void
}) {
  return (
    <div className="panel p-5 group hover:border-accent-primary/20 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-medium truncate">{ws.title}</h3>
          <span className="text-[11px] text-accent-primary/70 bg-accent-primary/10 px-2 py-0.5 rounded mt-1 inline-block">
            {ws.genre}
          </span>
          {ws.oneLiner && (
            <p className="text-xs text-white/40 mt-2 line-clamp-2">{ws.oneLiner}</p>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={onDelete} className="btn-ghost p-1.5 hover:text-red-400">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
        <span className="text-[10px] text-white/25">
          {ws.status === 'draft' ? '草稿' : ws.status}
          {' · '}
          {new Date(ws.updatedAt).toLocaleDateString('zh-CN')}
        </span>
        <button
          onClick={onEnter}
          className="flex items-center gap-1 text-xs text-accent-primary/70 hover:text-accent-primary transition-colors"
        >
          进入创作 <ChevronRight size={12} />
        </button>
      </div>
    </div>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const { workspaces, loading, loadWorkspaces, deleteWorkspace, setCurrentWorkspace } = useWorkspaceStore()
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    loadWorkspaces()
  }, [])

  const handleEnter = (ws: WorkspaceInfo) => {
    setCurrentWorkspace(ws.id)
    navigate(`/workbench/${ws.id}`)
  }

  const handleDelete = async (ws: WorkspaceInfo) => {
    if (confirm(`确定删除「${ws.title}」吗？此操作不可恢复。`)) {
      await deleteWorkspace(ws.id)
    }
  }

  return (
    <div className="h-full flex flex-col bg-surface">
      <header className="h-14 flex items-center px-6 shrink-0">
        <div className="flex items-center gap-3">
          <Library size={22} className="text-accent-primary" />
          <div>
            <h1 className="text-lg font-semibold">心御</h1>
            <p className="text-[10px] text-white/30">AI小说辅助器</p>
          </div>
        </div>
        <div className="flex-1" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 size={24} className="animate-spin text-white/20" />
          </div>
        ) : workspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <BookOpen size={40} className="text-white/10 mb-4" />
            <p className="text-white/25 text-sm mb-2">还没有作品</p>
            <p className="text-white/15 text-xs mb-6">创建你的第一个作品，开始构建世界</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
              <Plus size={14} /> 创建作品
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5 mt-2">
              <h2 className="text-sm text-white/50">我的作品 ({workspaces.length})</h2>
              <button onClick={() => setShowCreate(true)} className="btn-primary text-xs flex items-center gap-1">
                <Plus size={12} /> 新作品
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {workspaces.map((ws) => (
                <WorkspaceCard
                  key={ws.id}
                  ws={ws}
                  onEnter={() => handleEnter(ws)}
                  onDelete={() => handleDelete(ws)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {showCreate && <CreateWorkspaceModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
