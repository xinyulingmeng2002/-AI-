import { Check, X, ChevronDown, ChevronRight, Lightbulb } from 'lucide-react'
import { useState } from 'react'
import type { ExtractionCard as ExtractionCardType } from '@mindforge/core'
import { ENTITY_CATEGORY_LABELS } from '@mindforge/core'

interface Props {
  card: ExtractionCardType
  onConfirm: (id: string) => void
  onReject: (id: string) => void
}

const RELATION_COLORS: Record<string, string> = {
  new: 'text-green-400 bg-green-400/10 border-green-400/20',
  update: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  supplement: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  conflict: 'text-red-400 bg-red-400/10 border-red-400/20'
}

const RELATION_LABELS: Record<string, string> = {
  new: '新增',
  update: '更新',
  supplement: '补充',
  conflict: '[注意] 冲突'
}

export function ExtractionCardComponent({ card, onConfirm, onReject }: Props) {
  const [expanded, setExpanded] = useState(true)

  if (card.confirmed) return null

  return (
    <div className="bg-accent-primary/5 border border-accent-primary/20 rounded-lg overflow-hidden my-2">
      {/* 头部 */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent-primary/5"
        onClick={() => setExpanded(!expanded)}
      >
        <Lightbulb size={13} className="text-accent-primary shrink-0" />
        <span className="text-xs font-medium text-accent-primary/80 flex-1">
          AI 识别到 {card.entities.length} 个要素
        </span>
        {expanded ? <ChevronDown size={12} className="text-white/30" /> : <ChevronRight size={12} className="text-white/30" />}
      </div>

      {expanded && (
        <div className="px-3 pb-3">
          {/* 摘要 */}
          <p className="text-xs text-white/60 mb-2 leading-relaxed">{card.summary}</p>

          {/* 实体列表 */}
          <div className="space-y-1.5 mb-3">
            {card.entities.map((entity, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="text-white/25 w-12 shrink-0 text-right">
                  {ENTITY_CATEGORY_LABELS[entity.category]}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] border ${RELATION_COLORS[entity.relation]}`}>
                  {RELATION_LABELS[entity.relation]}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-white/80 font-medium">{entity.name}</span>
                  <span className="text-white/40"> — {entity.value.slice(0, 80)}{entity.value.length > 80 ? '...' : ''}</span>
                </div>
              </div>
            ))}
          </div>

          {/* 追问建议 */}
          {card.suggestedQuestions.length > 0 && (
            <div className="mb-3">
              <div className="text-[10px] text-white/30 mb-1">建议追问：</div>
              {card.suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  className="block w-full text-left text-xs text-accent-secondary/70 hover:text-accent-secondary
                             bg-accent-secondary/5 hover:bg-accent-secondary/10 rounded px-2 py-1 mb-1
                             transition-colors"
                  onClick={() => {
                    // 将建议追问填入输入框
                    const input = document.querySelector('.chat-input') as HTMLInputElement
                    if (input) {
                      input.value = q
                      input.focus()
                    }
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => onReject(card.id)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-white/40 hover:text-red-400
                         bg-white/5 hover:bg-red-400/10 rounded transition-colors"
            >
              <X size={11} /> 忽略
            </button>
            <button
              onClick={() => onConfirm(card.id)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-white bg-accent-primary
                         hover:bg-accent-primary/80 rounded transition-colors"
            >
              <Check size={11} /> 确认提取
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
