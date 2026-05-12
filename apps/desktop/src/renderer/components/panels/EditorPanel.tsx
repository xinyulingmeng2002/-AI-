import { useRef, useEffect, useCallback, useState } from 'react'
import { PenLine, ShieldCheck, Maximize2, AlertTriangle } from 'lucide-react'
import { TipTapEditor } from '@/components/editor/TipTapEditor'
import { FocusMode } from '@/components/editor/FocusMode'
import { useEditorStore } from '@/stores/editor'
import { useOutlineStore } from '@/stores/outline'
import { useWorkspaceStore } from '@/stores/workspace'
import { triggerAudit, formatAuditMessage } from '@/services/audit-service'
import { runObserver } from '@/services/observer-service'
import { detectSensitiveWords, formatSensitiveReport } from '@/services/sensitive-words'

const AUTO_SAVE_DELAY = 2000 // 2秒无操作后自动保存

export function EditorPanel() {
  const { wordCount, isDirty, setWordCount, setIsDirty, setSaved } = useEditorStore()
  const { activeChapterId, updateChapterWordCount, volumes } = useOutlineStore()
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastContentRef = useRef({ html: '', text: '' })
  const [auditing, setAuditing] = useState(false)
  const [editorKey, setEditorKey] = useState(0)
  const [loadedContent, setLoadedContent] = useState<string>('')
  const [focusMode, setFocusMode] = useState(false)
  const observerRanRef = useRef(false)

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
      observerRanRef.current = false // 新章节重置Observer
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

        // Observer: 首次保存后自动提取要素
        if (!observerRanRef.current && text.length > 500 && currentWorkspaceId) {
          observerRanRef.current = true
          runObserver(text, currentChapter?.title ?? '', currentWorkspaceId).then((obsResult) => {
            if (obsResult.card) {
              window.dispatchEvent(new CustomEvent('observer-result', {
                detail: { message: `## Observer 自动提取\n\n从本章中提取了 ${obsResult.card.entities.length} 个要素并已写入数据库。\n\n可在人物档案/世界观/伏笔面板中查看。` }
              }))
            }
          })
        }
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
    if (!currentChapter?.outline || !lastContentRef.current.text || !currentWorkspaceId) return
    setAuditing(true)
    try {
      const result = await triggerAudit({
        workspaceId: currentWorkspaceId,
        chapterOutline: currentChapter.outline,
        chapterContent: lastContentRef.current.text
      })
      let msg = formatAuditMessage(result)

      // 敏感词检测
      const sensitiveMatches = detectSensitiveWords(lastContentRef.current.text)
      if (sensitiveMatches.length > 0) {
        msg += '\n\n' + formatSensitiveReport(sensitiveMatches)
      }

      window.dispatchEvent(new CustomEvent('audit-result', {
        detail: { message: msg, result }
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
          <button
            onClick={() => setFocusMode(!focusMode)}
            className="flex items-center gap-1 text-white/40 hover:text-white/70 transition-colors"
            title="专注模式"
          >
            <Maximize2 size={13} />
          </button>
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
        {focusMode ? (
          <FocusMode
            enabled={focusMode}
            onToggle={() => setFocusMode(false)}
            wordCount={wordCount}
            targetWords={currentChapter?.outline?.targetWordCount ?? 0}
          >
            <TipTapEditor
              key={editorKey}
              content={loadedContent}
              onContentChange={handleContentChange}
              placeholder="专注写作中..."
              readOnly={false}
            />
          </FocusMode>
        ) : (
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
        )}
      </div>
    </div>
  )
}
