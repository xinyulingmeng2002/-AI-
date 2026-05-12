import { useRef, useEffect, useCallback, useState } from 'react'
import { PenLine, Save, ShieldCheck } from 'lucide-react'
import { TipTapEditor } from '@/components/editor/TipTapEditor'
import { useEditorStore } from '@/stores/editor'
import { useOutlineStore } from '@/stores/outline'
import { triggerAudit, formatAuditMessage } from '@/services/audit-service'

const AUTO_SAVE_DELAY = 2000 // 2秒无操作后自动保存

export function EditorPanel() {
  const { wordCount, isDirty, setWordCount, setIsDirty, setSaved } = useEditorStore()
  const { activeChapterId, updateChapterWordCount, volumes } = useOutlineStore()
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastContentRef = useRef({ html: '', text: '' })
  const [auditing, setAuditing] = useState(false)
  const [editorKey, setEditorKey] = useState(0) // 用于重建编辑器
  const [loadedContent, setLoadedContent] = useState<string>('')

  // 找到当前章节的纲要
  const currentChapter = volumes
    .flatMap((v) => v.chapters)
    .find((c) => c.id === activeChapterId)

  // 切换章节时加载内容
  useEffect(() => {
    if (!activeChapterId) {
      setLoadedContent('')
      setEditorKey((k) => k + 1)
      return
    }

    // 先保存当前内容
    if (lastContentRef.current.text) {
      doSave(lastContentRef.current.html, lastContentRef.current.text)
    }

    // 加载新章节内容
    const loadContent = async () => {
      try {
        const result = await window.mindforge.db.getOne('chapter_summaries', activeChapterId)
        if (result.success && result.data) {
          const content = (result.data as Record<string, unknown>).content as string ?? ''
          setLoadedContent(content)
          setWordCount(content.length)
          setSaved()
        } else {
          setLoadedContent('')
          setWordCount(0)
          setSaved()
        }
      } catch {
        setLoadedContent('')
      }
      setEditorKey((k) => k + 1)
    }

    loadContent()
  }, [activeChapterId])

  const doSave = useCallback(async (html: string, text: string) => {
    if (!activeChapterId) return

    try {
      const chapter = currentChapter
      // 先尝试更新
      let result = await window.mindforge.db.update('chapter_summaries', activeChapterId, {
        content: html,
        data_json: JSON.stringify(chapter?.outline ?? {}),
        word_count: text.length
      })

      // 如果记录不存在，插入新记录
      if (!result.success) {
        result = await window.mindforge.db.insert('chapter_summaries', {
          id: activeChapterId,
          workspace_id: '',
          volume_number: chapter?.volumeNumber ?? 1,
          chapter_number: chapter?.chapterNumber ?? 1,
          title: chapter?.title ?? '',
          content: html,
          data_json: JSON.stringify(chapter?.outline ?? {}),
          word_count: text.length
        })
      }

      if (result.success) {
        updateChapterWordCount(activeChapterId, text.length)
        setSaved()
      }
    } catch (err) {
      console.error('Auto-save failed:', err)
    }
  }, [activeChapterId, currentChapter, updateChapterWordCount, setSaved])

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

  const handleAudit = async () => {
    if (!currentChapter?.outline || !lastContentRef.current.text) return
    setAuditing(true)
    try {
      const result = await triggerAudit({
        chapterOutline: currentChapter.outline,
        chapterContent: lastContentRef.current.text
      })
      // 将审核结果以系统消息形式展示（通过自定义事件通知中枢）
      window.dispatchEvent(new CustomEvent('audit-result', {
        detail: { message: formatAuditMessage(result), result }
      }))
    } catch (err) {
      console.error('Audit failed:', err)
    } finally {
      setAuditing(false)
    }
  }

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
          {currentChapter?.outline && lastContentRef.current.text && (
            <button
              onClick={handleAudit}
              disabled={auditing}
              className="flex items-center gap-1 text-accent-primary/60 hover:text-accent-primary transition-colors"
              title="审核本章"
            >
              <ShieldCheck size={13} />
              {auditing ? '审核中...' : '审核'}
            </button>
          )}
          <span>{wordCount} 字</span>
          <span className={isDirty ? 'text-yellow-400/60' : 'text-green-400/60'}>
            {isDirty ? '● 未保存' : '● 已保存'}
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <TipTapEditor
          key={editorKey}
          content={loadedContent}
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
