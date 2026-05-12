import { Loader2 } from 'lucide-react'

export function LoadingSpinner({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={size} className="animate-spin text-white/20" />
    </div>
  )
}

export function LoadingText({ text = '加载中...' }: { text?: string }) {
  return <div className="text-white/20 text-[11px] text-center py-8">{text}</div>
}
