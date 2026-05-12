import { useEffect, useState, useRef } from 'react'
import { Maximize2, Minimize2, Clock, PenLine, Zap, Target, TrendingUp } from 'lucide-react'
import { useWritingGoalStore } from '@/stores/writing-goal'

interface Props {
  enabled: boolean; onToggle: () => void
  wordCount: number; targetWords: number; children?: React.ReactNode
}

export function FocusMode({ enabled, onToggle, wordCount, targetWords, children }: Props) {
  const { dailyGoal, todayWritten } = useWritingGoalStore()
  const [sessionStartCount] = useState(wordCount)
  const [sessionWords, setSessionWords] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setSessionWords(wordCount - sessionStartCount)
  }, [wordCount, sessionStartCount])

  useEffect(() => {
    if (enabled) {
      const start = Date.now()
      timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      setElapsed(0)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [enabled])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  const wph = elapsed > 0 ? Math.round((sessionWords / elapsed) * 3600) : 0

  if (!enabled) {
    return <button onClick={onToggle} className="btn-ghost p-1.5" title="专注模式"><Maximize2 size={14} /></button>
  }

  return (
    <div className="fixed inset-0 bg-surface z-50 flex flex-col">
      <div className="h-10 bg-surface-light flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4 text-xs text-white/40">
          <span className="flex items-center gap-1"><Clock size={11} />{formatTime(elapsed)}</span>
          <span className="flex items-center gap-1"><PenLine size={11} />{sessionWords} 字</span>
          {wph > 0 && <span className="flex items-center gap-1"><Zap size={11} />{wph} 字/时</span>}
          <span className="flex items-center gap-1"><Target size={11} />{todayWritten}/{dailyGoal}</span>
          {targetWords > 0 && <span className="flex items-center gap-1"><TrendingUp size={11} />{wordCount}/{targetWords} ({Math.min(100, Math.round((wordCount / targetWords) * 100))}%)</span>}
        </div>
        <button onClick={onToggle} className="btn-ghost p-1.5" title="退出专注模式"><Minimize2 size={14} /></button>
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
      <div className="h-1 bg-surface-lighter shrink-0">
        <div className="h-full bg-accent-primary transition-all duration-300"
          style={{ width: `${targetWords > 0 ? Math.min(100, (wordCount / targetWords) * 100) : 0}%` }} />
      </div>
    </div>
  )
}
