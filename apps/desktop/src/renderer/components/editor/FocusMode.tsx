import { useEffect, useState, useRef } from 'react'
import { Maximize2, Minimize2, Target, X } from 'lucide-react'
import { useWritingGoalStore } from '@/stores/writing-goal'

interface Props {
  enabled: boolean
  onToggle: () => void
  wordCount: number
  targetWords: number
  children?: React.ReactNode
}

export function FocusMode({ enabled, onToggle, wordCount, targetWords }: Props) {
  const { dailyGoal, todayWritten } = useWritingGoalStore()
  const [sessionStartCount] = useState(wordCount)
  const [sessionWords, setSessionWords] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setSessionWords(wordCount - sessionStartCount)
  }, [wordCount, sessionStartCount])

  if (!enabled) {
    return (
      <button onClick={onToggle} className="btn-ghost p-1.5" title="专注模式">
        <Maximize2 size={14} />
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-surface z-50 flex flex-col">
      {/* 顶部信息栏 */}
      <div className="h-10 bg-surface-light flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4 text-xs text-white/40">
          <span>📝 本次写作：{sessionWords} 字</span>
          <span>🎯 今日：{todayWritten}/{dailyGoal}</span>
          {targetWords > 0 && (
            <span>📊 章节目标：{wordCount}/{targetWords}</span>
          )}
        </div>
        <button onClick={onToggle} className="btn-ghost p-1.5" title="退出专注模式">
          <Minimize2 size={14} />
        </button>
      </div>

      {/* 编辑器占满全屏 */}
      <div className="flex-1 overflow-hidden">{children}</div>

      {/* 底部进度条 */}
      <div className="h-1 bg-surface-lighter shrink-0">
        <div
          className="h-full bg-accent-primary transition-all duration-300"
          style={{ width: `${targetWords > 0 ? Math.min(100, (wordCount / targetWords) * 100) : 0}%` }}
        />
      </div>
    </div>
  )
}
