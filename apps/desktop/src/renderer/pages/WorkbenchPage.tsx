import { useCallback, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useWorkbenchStore } from '@/stores/workbench'
import { useEditorStore } from '@/stores/editor'
import { useWorkspaceStore } from '@/stores/workspace'
import { OutlinePanel } from '@/components/panels/OutlinePanel'
import { EditorPanel } from '@/components/panels/EditorPanel'
import { ChatHubPanel } from '@/components/panels/ChatHubPanel'
import { BottomPanel } from '@/components/panels/BottomPanel'
import {
  PanelLeft, PanelRight, PanelBottom,
  LayoutDashboard, Settings, BookOpen
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function ResizeHandle({ direction, onResize }: {
  direction: 'horizontal' | 'vertical'
  onResize: (delta: number) => void
}) {
  const handleRef = useRef<HTMLDivElement>(null)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startPos = direction === 'horizontal' ? e.clientX : e.clientY

    const onMouseMove = (ev: MouseEvent) => {
      const delta = direction === 'horizontal'
        ? ev.clientX - startPos
        : ev.clientY - startPos
      onResize(delta)
    }

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [direction, onResize])

  return (
    <div
      ref={handleRef}
      onMouseDown={onMouseDown}
      className={`shrink-0 transition-colors
        ${direction === 'horizontal'
          ? 'w-1 cursor-col-resize hover:bg-accent-primary/30'
          : 'h-1 cursor-row-resize hover:bg-accent-primary/30'
        }`}
    />
  )
}

export function WorkbenchPage() {
  const navigate = useNavigate()
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const workspace = useWorkspaceStore((s) =>
    s.workspaces.find((w) => w.id === workspaceId)
  )
  const {
    leftPanelVisible, rightPanelVisible, bottomPanelVisible,
    leftPanelRatio, rightPanelRatio, bottomPanelRatio,
    toggleLeftPanel, toggleRightPanel, toggleBottomPanel,
    setLeftPanelRatio, setRightPanelRatio, setBottomPanelRatio
  } = useWorkbenchStore()
  const { wordCount, currentChapter } = useEditorStore()

  // 键盘快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b': e.preventDefault(); toggleLeftPanel(); break
          case 'j': e.preventDefault(); toggleBottomPanel(); break
          case '\\': e.preventDefault(); toggleRightPanel(); break
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleLeftPanel, toggleRightPanel, toggleBottomPanel])

  return (
    <div className="h-full flex flex-col">
      {/* 顶部导航栏 */}
      <header className="h-10 bg-surface-light border-b border-white/5 flex items-center px-3 shrink-0 drag">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-accent-primary" />
          <span className="text-sm font-medium">心御</span>
          <span className="text-xs text-white/30 ml-2">{workspace?.title ?? '未命名作品'}</span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1 no-drag">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-ghost p-1.5"
            title="个人仪表盘"
          >
            <LayoutDashboard size={14} />
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="btn-ghost p-1.5"
            title="设置"
          >
            <Settings size={14} />
          </button>
        </div>
      </header>

      {/* 主区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧大纲面板 */}
        {leftPanelVisible && (
          <>
            <div
              className="panel m-1.5 mr-0 overflow-hidden"
              style={{ width: `${leftPanelRatio * 100}%`, minWidth: 180 }}
            >
              <OutlinePanel />
            </div>
            <ResizeHandle
              direction="horizontal"
              onResize={(delta) => {
                const el = document.querySelector('.flex-1.flex') as HTMLElement
                if (el) {
                  const totalWidth = el.offsetWidth
                  setLeftPanelRatio(leftPanelRatio + delta / totalWidth)
                }
              }}
            />
          </>
        )}

        {/* 中间编辑器和下方面板 */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex overflow-hidden">
            {/* 编辑器 */}
            <div className="flex-1 panel m-1.5 overflow-hidden">
              <EditorPanel />
            </div>

            {/* 右侧聊天面板 */}
            {rightPanelVisible && (
              <>
                <ResizeHandle
                  direction="horizontal"
                  onResize={(delta) => {
                    const el = document.querySelector('.flex-1.flex') as HTMLElement
                    if (el) {
                      const totalWidth = el.offsetWidth
                      setRightPanelRatio(rightPanelRatio - delta / totalWidth)
                    }
                  }}
                />
                <div
                  className="panel m-1.5 ml-0 overflow-hidden"
                  style={{ width: `${rightPanelRatio * 100}%`, minWidth: 260 }}
                >
                  <ChatHubPanel />
                </div>
              </>
            )}
          </div>

          {/* 下方面板 */}
          {bottomPanelVisible && (
            <>
              <ResizeHandle
                direction="vertical"
                onResize={(delta) => {
                  const el = document.querySelector('.flex-1.flex') as HTMLElement
                  if (el) {
                    const totalHeight = el.offsetHeight
                    setBottomPanelRatio(bottomPanelRatio - delta / totalHeight)
                  }
                }}
              />
              <div
                className="panel m-1.5 mt-0 overflow-hidden"
                style={{ height: `${bottomPanelRatio * 100}%`, minHeight: 120 }}
              >
                <BottomPanel />
              </div>
            </>
          )}
        </div>
      </div>

      {/* 底部状态栏 */}
      <footer className="h-6 bg-surface-light border-t border-white/5 flex items-center px-3 text-xs text-white/30 shrink-0 gap-4">
        <button onClick={toggleLeftPanel} className={`hover:text-white/60 ${!leftPanelVisible ? 'text-white/15' : ''}`}>
          <PanelLeft size={12} />
        </button>
        <button onClick={toggleBottomPanel} className={`hover:text-white/60 ${!bottomPanelVisible ? 'text-white/15' : ''}`}>
          <PanelBottom size={12} />
        </button>
        <button onClick={toggleRightPanel} className={`hover:text-white/60 ${!rightPanelVisible ? 'text-white/15' : ''}`}>
          <PanelRight size={12} />
        </button>
        <span className="flex-1" />
        <span>{wordCount} 字</span>
        <span>{currentChapter}</span>
        <span className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500/50 inline-block" />
          模型已连接
        </span>
      </footer>
    </div>
  )
}
