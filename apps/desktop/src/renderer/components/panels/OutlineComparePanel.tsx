import { useOutlineStore } from '@/stores/outline'
import { useEditorStore } from '@/stores/editor'
import { CheckCircle2, Circle, AlertTriangle, Target, ListChecks, Link } from 'lucide-react'
import { EmptyState } from '@/components/shared/Loading'
import { extractKeywords } from '@mindforge/core'
import { useRef, useState, useEffect } from 'react'

export function OutlineComparePanel() {
  const { volumes } = useOutlineStore()
  const { wordCount } = useEditorStore()
  const [content, setContent] = useState('')

  // 监听编辑器内容变化
  useEffect(() => {
    const timer = setInterval(() => {
      const editorEl = document.querySelector('.ProseMirror')
      if (editorEl) setContent(editorEl.textContent ?? '')
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const activeChapter = volumes.flatMap((v) => v.chapters).find((c) =>
    c.id === useOutlineStore.getState().activeChapterId
  )

  if (!activeChapter?.outline) {
    return <EmptyState>请先在左侧大纲中选择一个章节</EmptyState>
  }

  const outline = activeChapter.outline

  // 检查目标达成
  const objectiveKw = extractKeywords(outline.objective.mainlineProgress, 5)
  const objectiveFound = objectiveKw.filter((kw) => content.includes(kw)).length
  const objectiveProgress = objectiveKw.length > 0 ? Math.round((objectiveFound / objectiveKw.length) * 100) : 100

  // 检查场景节拍
  const beatsCheck = outline.sceneBeats.map((beat) => {
    const beatKw = extractKeywords(beat.description || beat.title, 3)
    const found = beatKw.filter((kw) => content.includes(kw)).length
    return { ...beat, matched: beatKw.length > 0 ? found / beatKw.length >= 0.5 : true }
  })

  // 字数进度
  const wordProgress = outline.targetWordCount > 0 ? Math.min(100, Math.round((wordCount / outline.targetWordCount) * 100)) : 100

  return (
    <div className="p-3 space-y-4 overflow-y-auto h-full text-xs">
      {/* 本章目标 */}
      <div>
        <div className="flex items-center gap-1.5 text-white/40 mb-2">
          <Target size={12} />
          <span>本章目标</span>
          <span className="text-[10px] ml-auto">{objectiveProgress}%</span>
        </div>
        {outline.objective.mainlineProgress ? (
          <div className="bg-surface-lighter rounded-lg p-2">
            <p className="text-white/60 leading-relaxed text-[11px]">{outline.objective.mainlineProgress}</p>
            <div className="mt-1.5 bg-white/5 rounded-full h-1.5 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${objectiveProgress >= 70 ? 'bg-green-400' : 'bg-yellow-400'}`}
                style={{ width: `${objectiveProgress}%` }} />
            </div>
          </div>
        ) : (
          <div className="text-white/20 text-[11px]">未设定本章目标</div>
        )}
      </div>

      {/* 场景节拍 */}
      <div>
        <div className="flex items-center gap-1.5 text-white/40 mb-2">
          <ListChecks size={12} />
          <span>场景节拍 ({beatsCheck.filter(b => b.matched).length}/{beatsCheck.length})</span>
        </div>
        {beatsCheck.length === 0 ? (
          <div className="text-white/20 text-[11px]">未设定场景节拍</div>
        ) : (
          <div className="space-y-1">
            {beatsCheck.map((beat, i) => (
              <div key={i} className={`flex items-start gap-1.5 px-2 py-1 rounded text-[11px]
                ${beat.matched ? 'text-white/40' : 'text-yellow-400/70 bg-yellow-400/5'}`}>
                {beat.matched ? <CheckCircle2 size={11} className="text-green-400 mt-0.5 shrink-0" />
                              : <AlertTriangle size={11} className="mt-0.5 shrink-0" />}
                <div>
                  <span className="font-medium">{beat.title || `节拍${beat.order}`}</span>
                  <span className="text-white/20 ml-1">({beat.function})</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 伏笔检查 */}
      <div>
        <div className="flex items-center gap-1.5 text-white/40 mb-2">
          <Link size={12} />
          <span>伏笔</span>
        </div>
        {outline.foreshadowing.planted.length === 0 && outline.foreshadowing.recovered.length === 0 ? (
          <div className="text-white/20 text-[11px]">本章无伏笔操作</div>
        ) : (
          <div className="space-y-1">
            {outline.foreshadowing.planted.map((f, i) => (
              <div key={`p${i}`} className="flex items-center gap-1.5 text-[11px] text-white/40">
                <Circle size={10} className="text-blue-400" />
                <span>埋设: {f.description.slice(0, 40)}</span>
              </div>
            ))}
            {outline.foreshadowing.recovered.map((hookId, i) => (
              <div key={`r${i}`} className="flex items-center gap-1.5 text-[11px] text-white/40">
                <CheckCircle2 size={10} className="text-green-400" />
                <span>回收伏笔: {hookId}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 字数进度 */}
      <div className="pt-2 border-t border-white/5">
        <div className="flex justify-between text-[10px] text-white/30 mb-1">
          <span>字数进度</span>
          <span>{wordCount}/{outline.targetWordCount || '?'} 字 ({wordProgress}%)</span>
        </div>
        <div className="bg-white/5 rounded-full h-2 overflow-hidden">
          <div className={`h-full rounded-full transition-all ${wordProgress >= 100 ? 'bg-green-400' : wordProgress >= 70 ? 'bg-accent-primary' : 'bg-yellow-400'}`}
            style={{ width: `${wordProgress}%` }} />
        </div>
      </div>

      {/* 结尾钩子 */}
      {outline.endingHook && (
        <div className="pt-2 border-t border-white/5">
          <div className="text-[10px] text-white/30 mb-1">结尾钩子</div>
          <div className="bg-surface-lighter rounded-lg p-2 text-[11px] text-white/50">
            {outline.endingHook}
          </div>
        </div>
      )}
    </div>
  )
}
