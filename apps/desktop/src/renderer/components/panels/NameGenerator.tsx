import { useState } from 'react'
import { Wand2, Copy, Sparkles, Loader2, RefreshCw } from 'lucide-react'
import { generateLocalNames, generateAINames, CATEGORY_OPTIONS, type NameCategory } from '@/services/name-generator'

export function NameGenerator() {
  const [category, setCategory] = useState<NameCategory>('character_male')
  const [count, setCount] = useState(5)
  const [context, setContext] = useState('')
  const [names, setNames] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [mode, setMode] = useState<'local' | 'ai'>('local')

  const handleGenerate = async () => {
    setLoading(true)
    let result: string[]
    if (mode === 'ai') {
      result = await generateAINames(category, count, context)
    } else {
      // 模拟短暂延迟以提供反馈
      await new Promise((r) => setTimeout(r, 200))
      result = generateLocalNames(category, count)
    }
    setNames(result)
    setLoading(false)
  }

  const handleCopy = (name: string) => {
    navigator.clipboard.writeText(name)
    setCopied(name)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="h-full overflow-y-auto p-3 space-y-4">
      {/* 类型选择 */}
      <div>
        <label className="text-[10px] text-white/30 block mb-1.5">生成类型</label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setCategory(opt.value)}
              className={`text-[10px] px-2 py-1 rounded border transition-colors
                ${category === opt.value
                  ? 'border-accent-primary text-accent-primary bg-accent-primary/10'
                  : 'border-white/10 text-white/40 hover:border-white/20'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 选项 */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-[10px] text-white/30 block mb-1">数量</label>
          <input type="number" min={1} max={20} value={count}
            onChange={(e) => setCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 5)))}
            className="input-field text-xs py-1" />
        </div>
        <div>
          <label className="text-[10px] text-white/30 block mb-1">模式</label>
          <div className="flex bg-surface-lighter rounded-md p-0.5">
            {(['local', 'ai'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`text-[10px] px-2 py-1 rounded transition-colors
                  ${mode === m ? 'bg-accent-primary/20 text-accent-primary' : 'text-white/30'}`}
              >
                {m === 'local' ? '本地' : 'AI'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {mode === 'ai' && (
        <div>
          <label className="text-[10px] text-white/30 block mb-1">风格参考（可选）</label>
          <input className="input-field text-xs py-1" placeholder="如：古风雅致、霸气凌厉..."
            value={context} onChange={(e) => setContext(e.target.value)} />
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="btn-primary text-xs w-full flex items-center justify-center gap-1.5 py-2"
      >
        {loading ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
        {loading ? '生成中...' : '生成名字'}
      </button>

      {/* 结果列表 */}
      {names.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/30">结果</span>
            <button onClick={handleGenerate} className="btn-ghost p-1" title="重新生成">
              <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          {names.map((name, i) => (
            <div key={i}
              onClick={() => handleCopy(name)}
              className="flex items-center justify-between px-2 py-1.5 rounded bg-surface-lighter
                         hover:bg-white/5 cursor-pointer group transition-colors">
              <span className="text-xs text-white/70">{name}</span>
              <span className="text-[9px] text-white/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                {copied === name ? '已复制' : <Copy size={10} />}
              </span>
            </div>
          ))}
        </div>
      )}

      {names.length === 0 && !loading && (
        <div className="text-white/15 text-[10px] text-center py-6">
          选择类型，点击生成
        </div>
      )}
    </div>
  )
}
