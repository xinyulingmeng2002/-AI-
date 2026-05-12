import { useWorkbenchStore, type BottomPanelTab } from '@/stores/workbench'
import { useCharacterStore } from '@/stores/characters'
import { useOutlineStore } from '@/stores/outline'
import { Users, Globe, Link, FileText, Wand2, Clock, GitGraph, GitBranch, Layout, BookMarked } from 'lucide-react'
import { CharacterPanel } from './CharacterPanel'
import { CharacterEditor } from './CharacterEditor'
import { ChapterOutlineEditor } from './ChapterOutlineEditor'
import { WorldPanel } from './WorldPanel'
import { HooksPanel } from './HooksPanel'
import { NameGenerator } from './NameGenerator'
import { TimelinePanel } from './TimelinePanel'
import { OutlineComparePanel } from './OutlineComparePanel'
import { RelationshipGraph } from './RelationshipGraph'
import { SubplotPanel } from './SubplotPanel'
import { StoryboardPanel } from './StoryboardPanel'
import { GlossaryPanel } from './GlossaryPanel'

const TABS: Array<{ id: BottomPanelTab; label: string; icon: React.ReactNode }> = [
  { id: 'characters', label: '人物', icon: <Users size={13} /> },
  { id: 'relations', label: '关系', icon: <GitGraph size={13} /> },
  { id: 'subplots', label: '支线', icon: <GitBranch size={13} /> },
  { id: 'storyboard', label: '故事板', icon: <Layout size={13} /> },
  { id: 'world', label: '世界观', icon: <Globe size={13} /> },
  { id: 'glossary', label: '词典', icon: <BookMarked size={13} /> },
  { id: 'hooks', label: '伏笔', icon: <Link size={13} /> },
  { id: 'timeline', label: '时间线', icon: <Clock size={13} /> },
  { id: 'outline-compare', label: '纲要', icon: <FileText size={13} /> },
  { id: 'namegen', label: '起名', icon: <Wand2 size={13} /> }
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
        {bottomPanelTab === 'timeline' && <TimelinePanel />}
        {bottomPanelTab === 'relations' && <RelationshipGraph />}
        {bottomPanelTab === 'subplots' && <SubplotPanel />}
        {bottomPanelTab === 'storyboard' && <StoryboardPanel />}
        {bottomPanelTab === 'glossary' && <GlossaryPanel />}
        {bottomPanelTab === 'namegen' && <NameGenerator />}
        {bottomPanelTab === 'outline-compare' && <OutlineComparePanel />}
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
