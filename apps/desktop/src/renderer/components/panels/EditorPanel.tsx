import { PenLine } from 'lucide-react'
import { TipTapEditor } from '@/components/editor/TipTapEditor'
import { useEditorStore } from '@/stores/editor'

export function EditorPanel() {
  const { wordCount, isDirty, setWordCount, setIsDirty } = useEditorStore()

  const handleContentChange = (_html: string, _text: string, count: number) => {
    setWordCount(count)
    if (!isDirty) setIsDirty(true)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <PenLine size={14} />
          <span>编辑器</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/30">
          <span>{wordCount} 字</span>
          <span>{isDirty ? '● 未保存' : '已保存'}</span>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <TipTapEditor
          onContentChange={handleContentChange}
          placeholder="开始书写...

TipTap 富文本编辑器已就绪，支持 Markdown 快捷输入：
  # 空格 → 标题
  - 空格 → 无序列表
  > 空格 → 引用
  **文字** → 加粗"
        />
      </div>
    </div>
  )
}
