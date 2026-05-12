import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { EditorToolbar } from './EditorToolbar'
import { useCallback } from 'react'

interface Props {
  content?: string
  onContentChange?: (html: string, text: string, wordCount: number) => void
  placeholder?: string
  readOnly?: boolean
}

export function TipTapEditor({
  content,
  onContentChange,
  placeholder = '开始书写...',
  readOnly = false
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] }
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount,
      Highlight,
      Underline,
      TaskList,
      TaskItem.configure({ nested: true })
    ],
    content: content ?? '',
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px] px-4 py-2'
      }
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const text = editor.getText()
      const wordCount = editor.storage.characterCount?.characters?.() ?? text.length
      onContentChange?.(html, text, wordCount)
    }
  })

  const setContent = useCallback((newContent: string) => {
    editor?.commands.setContent(newContent)
  }, [editor])

  if (!editor) {
    return <div className="text-white/30 text-sm p-4">编辑器加载中...</div>
  }

  return (
    <div className="h-full flex flex-col">
      {!readOnly && <EditorToolbar editor={editor} />}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  )
}
