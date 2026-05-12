import { useWorkbenchStore, type BottomPanelTab } from '@/stores/workbench'
import { useCharacterStore } from '@/stores/characters'
import { useOutlineStore } from '@/stores/outline'
import { Users, Globe, Link, FileText, Wand2 } from 'lucide-react'
import { CharacterPanel } from './CharacterPanel'
import { CharacterEditor } from './CharacterEditor'
import { ChapterOutlineEditor } from './ChapterOutlineEditor'
import { WorldPanel } from './WorldPanel'
import { HooksPanel } from './HooksPanel'
import { NameGenerator } from './NameGenerator'

const TABS: Array<{ id: BottomPanelTab; label: string; icon: React.ReactNode }> = [
  { id: 'characters', label: '人物档案', icon: <Users size={13} /> },
  { id: 'world', label: '世界观', icon: <Globe size={13} /> },
  { id: 'hooks', label: '伏笔追踪', icon: <Link size={13} /> },
  { id: 'namegen', label: '起名器', icon: <Wand2 size={13} /> },
  { id: 'outline-compare', label: '纲要对照', icon: <FileText size={13} /> }
]

export function BottomPanel() {
  const { bottomPanelTab, setBottomPanelTab } = useWorkbenchStore()
  const editingId = useCharacterStore((s) => s.editingId)
  const editingOutlineId = useOutlineStore((s) => s.editingOutlineId)

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
      <div className="flex-1 overflow-hidden">
        {bottomPanelTab === 'characters' && <CharacterPanel />}
        {bottomPanelTab === 'world' && <WorldPanel />}
        {bottomPanelTab === 'hooks' && <HooksPanel />}
        {bottomPanelTab === 'namegen' && <NameGenerator />}
        {bottomPanelTab === 'outline-compare' && (
          <div className="p-4 text-white/25 text-xs text-center py-8">
            纲要对照 — 实时对比写作内容与章纲要<br />
            （将在后续迭代中实现，当前可在章纲要编辑器中查看）
          </div>
        )}
      </div>

      {/* 模态层 */}
      {editingId && <CharacterEditor />}
      {editingOutlineId && (
        <div className="fixed inset-y-0 right-0 w-[420px] bg-surface border-l border-white/10 shadow-2xl z-40">
          <ChapterOutlineEditor />
        </div>
      )}
    </div>
  )
}
