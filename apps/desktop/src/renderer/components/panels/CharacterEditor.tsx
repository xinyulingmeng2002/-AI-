import { useCharacterStore } from '@/stores/characters'
import { emitHubEvent } from '@/services/hub-events'
import { X, Save } from 'lucide-react'

export function CharacterEditor() {
  const { characters, editingId, setEditing, updateCharacter } = useCharacterStore()
  const char = characters.find((c) => c.id === editingId)

  if (!char || !editingId) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-20">
      <div className="bg-surface border border-white/10 rounded-xl w-[600px] max-h-[70vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
          <h3 className="text-sm font-medium">编辑人物 — {char.name}</h3>
          <button onClick={() => setEditing(null)} className="btn-ghost p-1">
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="名称">
              <input className="input-field text-xs" value={char.name}
                onChange={(e) => updateCharacter(editingId, { name: e.target.value })} />
            </Field>
            <Field label="原型">
              <input className="input-field text-xs" value={char.archetype} placeholder="英雄/反英雄/导师/... "
                onChange={(e) => updateCharacter(editingId, { archetype: e.target.value })} />
            </Field>
            <Field label="别名（逗号分隔）">
              <input className="input-field text-xs" value={char.aliases.join(', ')}
                onChange={(e) => updateCharacter(editingId, { aliases: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
            </Field>
          </div>

          {/* 性格 */}
          <SectionTitle title="性格特征" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="核心动机">
              <input className="input-field text-xs" value={char.personality.motivation}
                onChange={(e) => updateCharacter(editingId, { personality: { ...char.personality, motivation: e.target.value } })} />
            </Field>
            <Field label="核心恐惧">
              <input className="input-field text-xs" value={char.personality.fear}
                onChange={(e) => updateCharacter(editingId, { personality: { ...char.personality, fear: e.target.value } })} />
            </Field>
            <Field label="核心缺陷">
              <input className="input-field text-xs" value={char.personality.flaw}
                onChange={(e) => updateCharacter(editingId, { personality: { ...char.personality, flaw: e.target.value } })} />
            </Field>
            <Field label="MBTI（可选）">
              <input className="input-field text-xs" value={char.personality.mbti ?? ''} placeholder="如 INTJ"
                onChange={(e) => updateCharacter(editingId, { personality: { ...char.personality, mbti: e.target.value || null } })} />
            </Field>
          </div>

          {/* 外貌与说话风格 */}
          <SectionTitle title="外观与风格" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="外貌描述">
              <textarea className="input-field text-xs min-h-[60px] resize-y" value={char.appearance}
                onChange={(e) => updateCharacter(editingId, { appearance: e.target.value })} />
            </Field>
            <Field label="说话风格">
              <textarea className="input-field text-xs min-h-[60px] resize-y" value={char.speechStyle}
                onChange={(e) => updateCharacter(editingId, { speechStyle: e.target.value })} />
            </Field>
          </div>

          {/* 背景故事 */}
          <SectionTitle title="背景故事" />
          <textarea className="input-field text-xs min-h-[80px] resize-y w-full" value={char.background}
            onChange={(e) => updateCharacter(editingId, { background: e.target.value })} />

          {/* 人物弧光 */}
          <SectionTitle title="人物弧光" />
          <div className="grid grid-cols-3 gap-3">
            <Field label="当前阶段">
              <input className="input-field text-xs" value={char.arc.stage}
                onChange={(e) => updateCharacter(editingId, { arc: { ...char.arc, stage: e.target.value } })} />
            </Field>
            <Field label="进度 (0-100)">
              <input className="input-field text-xs" type="number" min={0} max={100} value={char.arc.progress}
                onChange={(e) => updateCharacter(editingId, { arc: { ...char.arc, progress: parseInt(e.target.value) || 0 } })} />
            </Field>
            <Field label="下一个里程碑">
              <input className="input-field text-xs" value={char.arc.nextMilestone}
                onChange={(e) => updateCharacter(editingId, { arc: { ...char.arc, nextMilestone: e.target.value } })} />
            </Field>
          </div>

          {/* 当前状态 */}
          <SectionTitle title="当前状态" />
          <div className="grid grid-cols-3 gap-3">
            <Field label="位置">
              <input className="input-field text-xs" value={char.currentState.location}
                onChange={(e) => updateCharacter(editingId, { currentState: { ...char.currentState, location: e.target.value } })} />
            </Field>
            <Field label="状态">
              <select className="input-field text-xs" value={char.currentState.status}
                onChange={(e) => updateCharacter(editingId, { currentState: { ...char.currentState, status: e.target.value } })}>
                <option value="alive">存活</option>
                <option value="injured">受伤</option>
                <option value="missing">失踪</option>
                <option value="dead">死亡</option>
                <option value="unknown">未知</option>
              </select>
            </Field>
            <Field label="情绪">
              <input className="input-field text-xs" value={char.currentState.emotionalState}
                onChange={(e) => updateCharacter(editingId, { currentState: { ...char.currentState, emotionalState: e.target.value } })} />
            </Field>
          </div>
        </div>

        <div className="p-4 border-t border-white/5">
          <button onClick={() => { emitHubEvent('module:edited', { module: `人物/${char.name}` }); setEditing(null) }} className="btn-primary text-xs w-full flex items-center justify-center gap-1">
            <Save size={12} /> 完成编辑
          </button>
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ title }: { title: string }) {
  return <div className="text-[10px] font-medium text-white/30 uppercase tracking-wider border-b border-white/5 pb-1">{title}</div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] text-white/30 block mb-0.5">{label}</label>
      {children}
    </div>
  )
}
