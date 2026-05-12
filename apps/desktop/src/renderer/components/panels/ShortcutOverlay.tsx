import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const SHORTCUTS = [
  { keys: 'Ctrl+S', desc: '手动保存' },
  { keys: 'Ctrl+B', desc: '切换左侧大纲面板' },
  { keys: 'Ctrl+J', desc: '切换下方面板' },
  { keys: 'Ctrl+\\', desc: '切换右侧中枢面板' },
  { keys: 'Ctrl+K', desc: '快捷键总览' },
  { keys: 'Enter', desc: '发送聊天消息' },
  { keys: '双击', desc: '编辑面板中的条目' },
  { keys: '拖拽', desc: '大纲章节/故事板节拍排序' },
]

export function ShortcutOverlay() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault()
        setVisible((v) => !v)
      }
      if (e.key === 'Escape') setVisible(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setVisible(false)}>
      <div className="bg-[#161625] border border-white/[0.08] rounded-xl p-6 w-[420px] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">快捷键总览</h3>
          <button onClick={() => setVisible(false)} className="btn-ghost p-1" aria-label="关闭">
            <X size={14} />
          </button>
        </div>
        <div className="space-y-1">
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-white/[0.03]">
              <span className="text-xs" style={{ color: 'oklch(78% 0.01 260)' }}>{s.desc}</span>
              <kbd className="text-[10px] px-2 py-0.5 rounded bg-[#1e1e32] border border-white/[0.08]" style={{ color: 'oklch(58% 0.008 260)' }}>
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
