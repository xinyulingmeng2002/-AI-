import { PenLine } from 'lucide-react'

export function EditorPanel() {
  return (
    <div className="h-full flex flex-col">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <PenLine size={14} />
          <span>编辑器</span>
        </div>
        <span className="text-xs text-white/30">第1章 · 未保存</span>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <textarea
          className="w-full h-full bg-transparent text-white/80 text-base leading-relaxed resize-none
                     placeholder-white/20 focus:outline-none font-serif"
          placeholder="在此开始写作...

TipTap 富文本编辑器（支持 Markdown）将在下一步集成。
当前为文本域占位。"
          readOnly
        />
      </div>
    </div>
  )
}
