import { FolderTree, Plus, GripVertical } from 'lucide-react'

export function OutlinePanel() {
  return (
    <div className="h-full flex flex-col">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <FolderTree size={14} />
          <span>大纲</span>
        </div>
        <button className="btn-ghost p-1" title="添加卷">
          <Plus size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {/* 占位：大纲树 */}
        <div className="text-white/30 text-xs p-4 text-center leading-relaxed">
          初始化大纲后，<br />
          卷/章结构将在此展示<br />
          <br />
          支持拖拽排序与<br />
          多层级管理
        </div>
      </div>
    </div>
  )
}
