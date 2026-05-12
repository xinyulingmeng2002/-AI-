import { useState, useCallback } from 'react'
import {
  FolderTree, Plus, GripVertical, ChevronRight, ChevronDown,
  FileText, Trash2, Edit3
} from 'lucide-react'
import { useOutlineStore } from '@/stores/outline'

export function OutlinePanel() {
  const {
    volumes, activeChapterId,
    addVolume, removeVolume, toggleVolumeExpanded,
    addChapter, removeChapter, setActiveChapter, openOutlineEditor
  } = useOutlineStore()
  const [newVolTitle, setNewVolTitle] = useState('')
  const [addingVol, setAddingVol] = useState(false)
  const [addingCh, setAddingCh] = useState<string | null>(null)
  const [newChTitle, setNewChTitle] = useState('')

  const handleAddVolume = () => {
    const title = newVolTitle.trim() || `第${volumes.length + 1}卷`
    addVolume(title)
    setNewVolTitle('')
    setAddingVol(false)
  }

  const handleAddChapter = (volumeId: string) => {
    const title = newChTitle.trim() || '新章节'
    addChapter(volumeId, title)
    setNewChTitle('')
    setAddingCh(null)
  }

  const [dragChapter, setDragChapter] = useState<{ id: string; volId: string } | null>(null)

  const onChapterDragStart = useCallback((e: React.DragEvent, chId: string, volId: string) => {
    e.dataTransfer.setData('text/plain', chId)
    e.dataTransfer.effectAllowed = 'move'
    setDragChapter({ id: chId, volId: volId })
  }, [])

  const onChapterDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onChapterDrop = useCallback((e: React.DragEvent, targetVolId: string, targetIndex: number) => {
    e.preventDefault()
    if (!dragChapter) return

    const { id, volId } = dragChapter
    // 找到源章节所在卷的索引
    const fromVol = volumes.find(v => v.id === volId)
    const fromIdx = fromVol?.chapters.findIndex(c => c.id === id) ?? -1

    if (fromIdx >= 0 && volId === targetVolId) {
      reorderChapters(volId, fromIdx, targetIndex)
    }
    setDragChapter(null)
  }, [dragChapter, volumes, reorderChapters])

  // 计算总字数
  const totalWords = volumes.reduce(
    (sum, v) => sum + v.chapters.reduce((s, c) => s + c.wordCount, 0),
    0
  )
  const totalChapters = volumes.reduce((sum, v) => sum + v.chapters.length, 0)

  return (
    <div className="h-full flex flex-col">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <FolderTree size={14} />
          <span>大纲</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-white/20">{totalChapters}章 · {totalWords}字</span>
          <button onClick={() => setAddingVol(true)} className="btn-ghost p-1" title="添加卷">
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-1">
        {addingVol && (
          <div className="flex gap-1 p-1 mb-1">
            <input
              className="input-field text-xs flex-1 py-1"
              placeholder="卷名..."
              value={newVolTitle}
              onChange={(e) => setNewVolTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddVolume()
                if (e.key === 'Escape') setAddingVol(false)
              }}
              autoFocus
            />
            <button onClick={handleAddVolume} className="btn-primary text-[10px] px-2">确定</button>
          </div>
        )}

        {volumes.length === 0 ? (
          <div className="text-white/20 text-xs text-center py-12 px-4 leading-relaxed">
            点击右上角 <Plus size={10} className="inline" /> 创建第一卷<br />
            卷内可添加多个章节<br />
            支持拖拽排序
          </div>
        ) : (
          volumes.map((vol) => (
            <div key={vol.id} className="mb-0.5">
              {/* 卷标题 */}
              <div className="flex items-center gap-1 px-1 py-1.5 rounded hover:bg-white/5 group cursor-pointer"
                   onClick={() => toggleVolumeExpanded(vol.id)}>
                {vol.expanded ? <ChevronDown size={12} className="text-white/30" /> : <ChevronRight size={12} className="text-white/30" />}
                <span className="text-xs font-medium text-white/60 flex-1 truncate">{vol.title}</span>
                <span className="text-[10px] text-white/20">{vol.chapters.length}章</span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeVolume(vol.id) }}
                  className="opacity-0 group-hover:opacity-100 btn-ghost p-0.5 hover:text-red-400"
                >
                  <Trash2 size={10} />
                </button>
              </div>

              {/* 章节列表 */}
              {vol.expanded && (
                <div className="ml-3 border-l border-white/5 pl-2">
                  {vol.chapters.map((ch) => (
                    <div
                      key={ch.id}
                      draggable
                      onDragStart={(e) => onChapterDragStart(e, ch.id, vol.id)}
                      onDragOver={onChapterDragOver}
                      onDrop={(e) => onChapterDrop(e, vol.id, ch.chapterNumber - 1)}
                      onClick={() => setActiveChapter(ch.id)}
                      className={`flex items-center gap-1 px-1.5 py-1 rounded text-xs cursor-pointer group
                        transition-colors
                        ${dragChapter?.id === ch.id ? 'opacity-40' : ''}
                        ${activeChapterId === ch.id
                          ? 'bg-accent-primary/15 text-accent-primary'
                          : 'text-white/50 hover:bg-white/5 hover:text-white/70'
                        }`}
                    >
                      <FileText size={11} className="shrink-0" />
                      <span className="flex-1 truncate">
                        {ch.chapterNumber}. {ch.title}
                      </span>
                      {ch.wordCount > 0 && (
                        <span className="text-[9px] text-white/20">{ch.wordCount}字</span>
                      )}
                      <div className="opacity-0 group-hover:opacity-100 flex gap-0.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); openOutlineEditor(ch.id) }}
                          className="btn-ghost p-0.5"
                          title="编辑纲要"
                        >
                          <Edit3 size={10} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeChapter(ch.id) }}
                          className="btn-ghost p-0.5 hover:text-red-400"
                          title="删除"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* 添加章节 */}
                  {addingCh === vol.id ? (
                    <div className="flex gap-1 px-2 py-1">
                      <input
                        className="input-field text-[11px] flex-1 py-0.5"
                        placeholder="章节名..."
                        value={newChTitle}
                        onChange={(e) => setNewChTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddChapter(vol.id)
                          if (e.key === 'Escape') setAddingCh(null)
                        }}
                        autoFocus
                      />
                      <button onClick={() => handleAddChapter(vol.id)} className="btn-primary text-[10px] px-1.5">确定</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingCh(vol.id)}
                      className="flex items-center gap-1 px-2 py-1 text-[11px] text-white/25 hover:text-white/50 w-full rounded"
                    >
                      <Plus size={10} /> 添加章节
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
