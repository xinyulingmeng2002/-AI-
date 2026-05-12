import { useWorkbenchStore, type BottomPanelTab } from '@/stores/workbench'
import { Users, Globe, Link, FileText } from 'lucide-react'

const TABS: Array<{ id: BottomPanelTab; label: string; icon: React.ReactNode }> = [
  { id: 'characters', label: '人物档案', icon: <Users size={13} /> },
  { id: 'world', label: '世界观', icon: <Globe size={13} /> },
  { id: 'hooks', label: '伏笔追踪', icon: <Link size={13} /> },
  { id: 'outline-compare', label: '纲要对照', icon: <FileText size={13} /> }
]

export function BottomPanel() {
  const { bottomPanelTab, setBottomPanelTab } = useWorkbenchStore()

  return (
    <div className="h-full flex flex-col">
      {/* 标签栏 */}
      <div className="flex border-b border-white/5 px-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setBottomPanelTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs transition-colors
              ${bottomPanelTab === tab.id
                ? 'text-accent-primary border-b-2 border-accent-primary -mb-px'
                : 'text-white/40 hover:text-white/70'
              }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-white/25 text-xs text-center py-8">
          {bottomPanelTab === 'characters' && '人物档案系统 —— 从智能交流中枢聊天中动态填充'}
          {bottomPanelTab === 'world' && '世界观管理 —— 地理、势力、规则、历史'}
          {bottomPanelTab === 'hooks' && '伏笔追踪 —— 埋设 → 呼应 → 回收，全生命周期管理'}
          {bottomPanelTab === 'outline-compare' && '纲要对照 —— 实时对比写作内容与章纲要'}
        </div>
      </div>
    </div>
  )
}
