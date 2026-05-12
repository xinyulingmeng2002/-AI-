import { useOutlineStore } from '@/stores/outline'
import { EmptyState } from '@/components/shared/Loading'
import { Move, Plus, X } from 'lucide-react'
import { useState } from 'react'

export function StoryboardPanel() {
  const { volumes } = useOutlineStore()
  const activeChapter = volumes.flatMap((v) => v.chapters).find((c) =>
    c.id === useOutlineStore.getState().activeChapterId
  )
  const updateChapterOutline = useOutlineStore((s) => s.updateChapterOutline)
  const [dragging, setDragging] = useState<number | null>(null)

  if (!activeChapter?.outline) {
    return <EmptyState>请先在左侧大纲中选择一个章节，然后编辑其纲要中的场景节拍。</EmptyState>
  }

  const beats = activeChapter.outline.sceneBeats

  const handleDrop = (targetIdx: number) => {
    if (dragging === null || dragging === targetIdx) { setDragging(null); return }
    const newBeats = [...beats]
    const [moved] = newBeats.splice(dragging, 1)
    newBeats.splice(targetIdx, 0, { ...moved, order: 0 })
    updateChapterOutline(activeChapter.id, {
      sceneBeats: newBeats.map((b, i) => ({ ...b, order: i + 1 }))
    })
    setDragging(null)
  }

  const addBeat = () => {
    updateChapterOutline(activeChapter.id, {
      sceneBeats: [...beats, {
        order: beats.length + 1, title: '', description: '',
        function: 'development', targetWordCount: 600, emotionalTone: ''
      }]
    })
  }

  const removeBeat = (idx: number) => {
    const newBeats = beats.filter((_, i) => i !== idx)
    updateChapterOutline(activeChapter.id, {
      sceneBeats: newBeats.map((b, i) => ({ ...b, order: i + 1 }))
    })
  }

  const functionColors: Record<string, string> = {
    setup: 'border-l-blue-400', development: 'border-l-yellow-400',
    turn: 'border-l-orange-400', climax: 'border-l-red-400', hook: 'border-l-purple-400'
  }

  const functionLabels: Record<string, string> = {
    setup: '起因', development: '发展', turn: '转折', climax: '高潮', hook: '钩子'
  }

  return (
    <div className="p-3 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-white/30">{beats.length} 个场景节拍</span>
        <button onClick={addBeat} className="btn-ghost p-1"><Plus size={12} /></button>
      </div>

      {beats.length === 0 ? (
        <EmptyState>点击 + 添加场景节拍。拖拽卡片可重新排序。</EmptyState>
      ) : (
        <div className="space-y-2">
          {beats.map((beat, i) => (
            <div
              key={i}
              draggable
              onDragStart={() => setDragging(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(i)}
              className={`border border-white/[0.06] rounded-lg p-3 cursor-grab active:cursor-grabbing
                ${beat.function === 'climax' ? 'bg-red-400/[0.05]' :
                  beat.function === 'hook' ? 'bg-violet-400/[0.05]' :
                  beat.function === 'turn' ? 'bg-amber-400/[0.03]' : 'bg-[#1e1e32]'}
                ${dragging === i ? 'opacity-40' : ''}
                hover:bg-white/5 transition-colors`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Move size={10} className="text-white/20" />
                  <span className="text-[10px] text-white/30">#{beat.order}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                    beat.function === 'climax' ? 'bg-red-400/10 text-red-400' :
                    beat.function === 'hook' ? 'bg-purple-400/10 text-purple-400' :
                    'bg-white/5 text-white/40'
                  }`}>{functionLabels[beat.function] ?? beat.function}</span>
                </div>
                <button onClick={() => removeBeat(i)} className="btn-ghost p-0.5 hover:text-red-400"><X size={10} /></button>
              </div>
              <input
                className="bg-transparent text-xs text-white/70 w-full focus:outline-none font-medium mb-1"
                value={beat.title}
                placeholder="节拍标题..."
                onChange={(e) => {
                  const newBeats = [...beats]
                  newBeats[i] = { ...newBeats[i], title: e.target.value }
                  updateChapterOutline(activeChapter.id, { sceneBeats: newBeats })
                }}
              />
              <input
                className="bg-transparent text-[10px] text-white/30 w-full focus:outline-none"
                value={beat.description || ''}
                placeholder="描述..."
                onChange={(e) => {
                  const newBeats = [...beats]
                  newBeats[i] = { ...newBeats[i], description: e.target.value }
                  updateChapterOutline(activeChapter.id, { sceneBeats: newBeats })
                }}
              />
              <div className="flex gap-3 mt-2 text-[9px] text-white/20">
                <span> {beat.targetWordCount}字</span>
                <span> {beat.emotionalTone || '未设'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
