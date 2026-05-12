import { useRef, useEffect, useCallback } from 'react'
import { PenLine, Save } from 'lucide-react'
import { TipTapEditor } from '@/components/editor/TipTapEditor'
import { useEditorStore } from '@/stores/editor'
import { useOutlineStore } from '@/stores/outline'

const AUTO_SAVE_DELAY = 2000 // 2秒无操作后自动保存

export function EditorPanel() {
  const { wordCount, isDirty, setWordCount, setIsDirty, setSaved } = useEditorStore()
  const { activeChapterId, updateChapterWordCount } = useOutlineStore()
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastContentRef = useRef({ html: '', text: '' })

  const doSave = useCallback(async (html: string, text: string) => {
    if (!activeChapterId) return

    try {
      // 持久化到 SQLite
      const result = await window.mindforge.db.update('chapter_summaries', activeChapterId, {
        content: html,
        word_count: text.length
      })

      if (result.success) {
        updateChapterWordCount(activeChapterId, text.length)
        setSaved()
      }
    } catch (err) {
      console.error('Auto-save failed:', err)
    }
  }, [activeChapterId, updateChapterWordCount, setSaved])

  const handleContentChange = useCallback((html: string, text: string, count: number) => {
    setWordCount(count)
    lastContentRef.current = { html, text }

    if (!isDirty) setIsDirty(true)

    // 防抖自动保存
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      doSave(html, text)
    }, AUTO_SAVE_DELAY)
  }, [isDirty, setWordCount, setIsDirty, doSave])

  // 手动保存 (Ctrl+S)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        doSave(lastContentRef.current.html, lastContentRef.current.text)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [doSave])

  // 组件卸载时保存
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (lastContentRef.current.text) {
        doSave(lastContentRef.current.html, lastContentRef.current.text)
      }
    }
  }, [])

  return (
    <div className="h-full flex flex-col">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <PenLine size={14} />
          <span>编辑器</span>
          {activeChapterId && (
            <span className="text-[10px] text-accent-primary/50">— 写作中</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-white/30">
          <span>{wordCount} 字</span>
          <span className={isDirty ? 'text-yellow-400/60' : 'text-green-400/60'}>
            {isDirty ? '● 未保存' : '● 已保存'}
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <TipTapEditor
          onContentChange={handleContentChange}
          placeholder={
            activeChapterId
              ? "开始书写...\n\nTipTap 富文本编辑器已就绪\nCtrl+S 手动保存 · 2秒无操作自动保存"
              : "请先在左侧大纲中创建或选择一个章节"
          }
          readOnly={!activeChapterId}
        />
      </div>
    </div>
  )
}
