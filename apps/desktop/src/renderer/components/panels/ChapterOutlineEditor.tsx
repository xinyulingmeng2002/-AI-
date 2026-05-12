import { useOutlineStore } from '@/stores/outline'
import { X, Save, Target, Swords, Users, ListChecks, Link, Flag } from 'lucide-react'

export function ChapterOutlineEditor() {
  const { volumes, editingOutlineId, closeOutlineEditor, updateChapterOutline } = useOutlineStore()

  // 找到正在编辑的章纲要
  let chapter: ReturnType<typeof useOutlineStore.getState>['volumes'][0]['chapters'][0] | null = null
  if (editingOutlineId) {
    for (const vol of volumes) {
      const found = vol.chapters.find((c) => c.id === editingOutlineId)
      if (found) { chapter = found; break }
    }
  }

  if (!chapter || !chapter.outline || !editingOutlineId) {
    return null
  }

  const outline = chapter.outline

  return (
    <div className="h-full flex flex-col bg-surface">
      <div className="panel-header">
        <span className="text-xs font-medium">编辑纲要 — {chapter.title}</span>
        <button onClick={closeOutlineEditor} className="btn-ghost p-1">
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* 本章目标 */}
        <Section icon={<Target size={13} />} title="本章目标">
          <textarea
            className="input-field text-xs min-h-[60px] resize-y"
            placeholder="本章要推进哪条主线？进度推进多少？"
            value={outline.objective.mainlineProgress}
            onChange={(e) => updateChapterOutline(editingOutlineId!, {
              objective: { ...outline.objective, mainlineProgress: e.target.value }
            })}
          />
        </Section>

        {/* 核心冲突 */}
        <Section icon={<Swords size={13} />} title="核心冲突">
          <div className="flex gap-2 mb-2">
            {(['character_vs_character', 'character_vs_environment', 'character_vs_self', 'multi'] as const).map((type) => (
              <button
                key={type}
                onClick={() => updateChapterOutline(editingOutlineId!, {
                  coreConflict: { ...outline.coreConflict, type }
                })}
                className={`text-[10px] px-2 py-1 rounded border transition-colors
                  ${outline.coreConflict.type === type
                    ? 'border-accent-primary text-accent-primary bg-accent-primary/10'
                    : 'border-white/10 text-white/40'
                  }`}
              >
                {type === 'character_vs_character' && '人 vs 人'}
                {type === 'character_vs_environment' && '人 vs 环境'}
                {type === 'character_vs_self' && '人 vs 自我'}
                {type === 'multi' && '复合冲突'}
              </button>
            ))}
          </div>
          <textarea
            className="input-field text-xs min-h-[50px] resize-y"
            placeholder="描述核心冲突..."
            value={outline.coreConflict.description}
            onChange={(e) => updateChapterOutline(editingOutlineId!, {
              coreConflict: { ...outline.coreConflict, description: e.target.value }
            })}
          />
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-white/30">冲突强度</span>
            <input
              type="range" min={1} max={5} step={1}
              value={outline.coreConflict.intensity}
              onChange={(e) => updateChapterOutline(editingOutlineId!, {
                coreConflict: { ...outline.coreConflict, intensity: parseInt(e.target.value) as 1|2|3|4|5 }
              })}
              className="flex-1"
            />
            <span className="text-[10px] text-white/40">{outline.coreConflict.intensity}/5</span>
          </div>
        </Section>

        {/* 场景节拍 */}
        <Section icon={<ListChecks size={13} />} title="场景节拍">
          {outline.sceneBeats.length === 0 ? (
            <p className="text-[10px] text-white/20">暂无节拍，点击下方添加</p>
          ) : (
            <div className="space-y-1.5">
              {outline.sceneBeats.map((beat, i) => (
                <div key={i} className="bg-surface-lighter rounded p-2 text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white/30">#{beat.order}</span>
                    <input
                      className="bg-transparent text-white/70 flex-1 focus:outline-none text-xs"
                      value={beat.title}
                      onChange={(e) => {
                        const beats = [...outline.sceneBeats]
                        beats[i] = { ...beats[i], title: e.target.value }
                        updateChapterOutline(editingOutlineId!, { sceneBeats: beats })
                      }}
                    />
                    <select
                      className="bg-surface text-[10px] text-white/40 rounded px-1 py-0.5"
                      value={beat.function}
                      onChange={(e) => {
                        const beats = [...outline.sceneBeats]
                        beats[i] = { ...beats[i], function: e.target.value as never }
                        updateChapterOutline(editingOutlineId!, { sceneBeats: beats })
                      }}
                    >
                      <option value="setup">起因</option>
                      <option value="development">发展</option>
                      <option value="turn">转折</option>
                      <option value="climax">高潮</option>
                      <option value="hook">钩子</option>
                    </select>
                  </div>
                  <input
                    className="bg-transparent text-white/40 text-[11px] w-full focus:outline-none"
                    value={beat.description || ''}
                    placeholder="描述..."
                    onChange={(e) => {
                      const beats = [...outline.sceneBeats]
                      beats[i] = { ...beats[i], description: e.target.value }
                      updateChapterOutline(editingOutlineId!, { sceneBeats: beats })
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => {
              const beats = [...outline.sceneBeats]
              beats.push({
                order: beats.length + 1,
                title: '',
                description: '',
                function: 'development',
                targetWordCount: 600,
                emotionalTone: ''
              })
              updateChapterOutline(editingOutlineId!, { sceneBeats: beats })
            }}
            className="text-[10px] text-accent-primary/60 hover:text-accent-primary mt-1"
          >
            + 添加节拍
          </button>
        </Section>

        {/* 伏笔 */}
        <Section icon={<Link size={13} />} title="伏笔操作">
          <div className="text-[10px] text-white/30 mb-1">本章埋设</div>
          {outline.foreshadowing.planted.map((f, i) => (
            <div key={i} className="flex gap-1 mb-1">
              <input
                className="input-field text-[11px] flex-1 py-1"
                value={f.description}
                placeholder="伏笔描述..."
                onChange={(e) => {
                  const planted = [...outline.foreshadowing.planted]
                  planted[i] = { ...planted[i], description: e.target.value }
                  updateChapterOutline(editingOutlineId!, {
                    foreshadowing: { ...outline.foreshadowing, planted }
                  })
                }}
              />
            </div>
          ))}
          <button
            onClick={() => {
              const planted = [...outline.foreshadowing.planted, {
                description: '',
                expectedPayoffChapter: null,
                importance: 'minor' as const
              }]
              updateChapterOutline(editingOutlineId!, {
                foreshadowing: { ...outline.foreshadowing, planted }
              })
            }}
            className="text-[10px] text-accent-primary/60 hover:text-accent-primary"
          >
            + 添加伏笔
          </button>
        </Section>

        {/* 结尾钩子 */}
        <Section icon={<Flag size={13} />} title="结尾钩子">
          <textarea
            className="input-field text-xs min-h-[50px] resize-y"
            placeholder="用什么悬念引导读者继续看下一章？"
            value={outline.endingHook}
            onChange={(e) => updateChapterOutline(editingOutlineId!, { endingHook: e.target.value })}
          />
        </Section>

        {/* 目标字数 */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40">目标字数</span>
          <input
            type="number"
            className="input-field w-24 text-xs text-right"
            value={outline.targetWordCount}
            onChange={(e) => updateChapterOutline(editingOutlineId!, { targetWordCount: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="p-3 border-t border-white/5">
        <button onClick={closeOutlineEditor} className="btn-primary text-xs w-full flex items-center justify-center gap-1">
          <Save size={12} /> 保存纲要
        </button>
      </div>
    </div>
  )
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-white/50 mb-2">
        {icon}
        <span>{title}</span>
      </div>
      {children}
    </div>
  )
}
