import type { Editor } from '@tiptap/react'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code,
  Heading1, Heading2, Heading3, List, ListOrdered, Quote,
  Undo, Redo, Highlighter, Minus, WrapText
} from 'lucide-react'

interface Props {
  editor: Editor
}

function ToolButton({ onClick, active, title, children }: {
  onClick: () => void
  active: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded transition-colors text-xs
        ${active
          ? 'bg-accent-primary/20 text-accent-primary'
          : 'text-white/40 hover:text-white/70 hover:bg-white/5'
        }`}
      title={title}
    >
      {children}
    </button>
  )
}

export function EditorToolbar({ editor }: Props) {
  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-white/5 flex-wrap bg-surface-light/50">
      {/* 撤销/重做 */}
      <ToolButton onClick={() => editor.chain().undo().run()} active={false} title="撤销">
        <Undo size={14} />
      </ToolButton>
      <ToolButton onClick={() => editor.chain().redo().run()} active={false} title="重做">
        <Redo size={14} />
      </ToolButton>

      <div className="w-px h-4 bg-white/10 mx-1" />

      {/* 标题 */}
      <ToolButton
        onClick={() => editor.chain().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
        title="标题1"
      >
        <Heading1 size={14} />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="标题2"
      >
        <Heading2 size={14} />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        title="标题3"
      >
        <Heading3 size={14} />
      </ToolButton>

      <div className="w-px h-4 bg-white/10 mx-1" />

      {/* 格式 */}
      <ToolButton
        onClick={() => editor.chain().toggleBold().run()}
        active={editor.isActive('bold')}
        title="加粗"
      >
        <Bold size={14} />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="斜体"
      >
        <Italic size={14} />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().toggleUnderline().run()}
        active={editor.isActive('underline')}
        title="下划线"
      >
        <UnderlineIcon size={14} />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().toggleStrike().run()}
        active={editor.isActive('strike')}
        title="删除线"
      >
        <Strikethrough size={14} />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().toggleHighlight().run()}
        active={editor.isActive('highlight')}
        title="高亮"
      >
        <Highlighter size={14} />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().toggleCode().run()}
        active={editor.isActive('code')}
        title="行内代码"
      >
        <Code size={14} />
      </ToolButton>

      <div className="w-px h-4 bg-white/10 mx-1" />

      {/* 列表 */}
      <ToolButton
        onClick={() => editor.chain().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="无序列表"
      >
        <List size={14} />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="有序列表"
      >
        <ListOrdered size={14} />
      </ToolButton>

      <div className="w-px h-4 bg-white/10 mx-1" />

      {/* 其他 */}
      <ToolButton
        onClick={() => editor.chain().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        title="引用"
      >
        <Quote size={14} />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().setHorizontalRule().run()}
        active={false}
        title="分割线"
      >
        <Minus size={14} />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().setHardBreak().run()}
        active={false}
        title="换行"
      >
        <WrapText size={14} />
      </ToolButton>
    </div>
  )
}
