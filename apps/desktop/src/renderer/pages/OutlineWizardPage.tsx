import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useWorkspaceStore } from '@/stores/workspace'
import { ArrowLeft, Sparkles, CheckCircle2, BookOpen, Loader2, ChevronRight } from 'lucide-react'

type WizardStep = 'fill' | 'review' | 'done'

export function OutlineWizardPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const navigate = useNavigate()
  const { workspaces, setCurrentWorkspace } = useWorkspaceStore()
  const workspace = workspaces.find((w) => w.id === workspaceId)

  const [step, setStep] = useState<WizardStep>('fill')
  const [outlineText, setOutlineText] = useState('')
  const [reviewResult, setReviewResult] = useState<string | null>(null)
  const [reviewing, setReviewing] = useState(false)

  const handleSubmitOutline = async () => {
    if (!outlineText.trim()) return
    setReviewing(true)
    setStep('review')

    // 模拟 AI 审核（实际项目中使用模型路由层调用 LLM）
    await new Promise((r) => setTimeout(r, 1500))

    const hasBasicElements =
      outlineText.length >= 30

    if (hasBasicElements) {
      setReviewResult(
        '你的大纲基础框架已经具备，包含了故事的基本方向。在实际使用时，AI会基于你配置的模型进行更详细的分析，评估世界观完整性、人物动机清晰度、主线张力等维度。现在可以进入创作工作台，在智能交流中枢中继续完善。'
      )
    } else {
      setReviewResult(
        '大纲内容似乎还比较简略。建议至少包含：故事的核心冲突、主要人物、世界观的基本设定。不过没关系，这些都可以在智能交流中枢中边聊边完善。'
      )
    }
    setReviewing(false)
  }

  const handleEnterWorkbench = () => {
    if (workspaceId) {
      setCurrentWorkspace(workspaceId)
      navigate(`/workbench/${workspaceId}`)
    }
  }

  if (!workspace) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-white/30">作品不存在</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* 顶部进度条 */}
      <header className="h-12 flex items-center px-6 shrink-0 border-b border-white/5">
        <button onClick={() => navigate('/')} className="btn-ghost p-1.5 mr-3">
          <ArrowLeft size={14} />
        </button>
        <span className="text-sm font-medium">{workspace.title}</span>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-xs text-white/30">
          <span className={step === 'fill' ? 'text-accent-primary' : ''}>① 填写大纲</span>
          <ChevronRight size={10} />
          <span className={step === 'review' ? 'text-accent-primary' : ''}>② AI审核</span>
          <ChevronRight size={10} />
          <span className={step === 'done' ? 'text-accent-primary' : ''}>③ 开始创作</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-12 px-6">
          {step === 'fill' && (
            <div className="space-y-6">
              <div className="text-center">
                <BookOpen size={32} className="text-accent-primary mx-auto mb-3" />
                <h2 className="text-xl font-medium mb-2">初始化大纲</h2>
                <p className="text-sm text-white/40 leading-relaxed">
                  你不需要一次性写完所有细节。<br />
                  写一个粗糙的草稿就好——大纲会在创作过程中持续生长完善。
                </p>
              </div>

              <div>
                <label className="text-xs text-white/50 block mb-2">
                  作品信息
                </label>
                <div className="bg-surface-lighter rounded-lg p-4 text-sm space-y-1 mb-4">
                  <div><span className="text-white/30">作品名：</span>{workspace.title}</div>
                  <div><span className="text-white/30">类型：</span>{workspace.genre}</div>
                  {workspace.oneLiner && (
                    <div><span className="text-white/30">一句话简介：</span>{workspace.oneLiner}</div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs text-white/50 block mb-2">
                  初始大纲 <span className="text-white/20">（自由书写，想到什么写什么）</span>
                </label>
                <textarea
                  className="input-field text-sm min-h-[200px] resize-y font-serif leading-relaxed"
                  placeholder={`写下你目前能想到的所有内容，例如：

- 这是一个关于___的故事
- 主角是___，他/她想要___
- 世界设定是___，特点是___
- 主要的冲突来自于___
- 我想表达的主题是___
- 可能的结局走向是___

不需要拘泥于格式，尽情写下你的灵感...`}
                  value={outlineText}
                  onChange={(e) => setOutlineText(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSubmitOutline}
                  disabled={!outlineText.trim()}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <Sparkles size={14} />
                  提交审核
                </button>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="text-center space-y-6">
              {reviewing ? (
                <>
                  <Loader2 size={40} className="animate-spin text-accent-primary mx-auto" />
                  <h2 className="text-lg font-medium">AI 正在审核你的大纲...</h2>
                  <p className="text-sm text-white/30">评估世界观完整性、人物动机、主线张力...</p>
                </>
              ) : (
                <>
                  <CheckCircle2 size={40} className="text-green-400 mx-auto" />
                  <h2 className="text-lg font-medium">审核完成</h2>
                  <div className="bg-surface-lighter rounded-lg p-6 text-left">
                    <p className="text-sm text-white/70 leading-relaxed">{reviewResult}</p>
                  </div>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => { setStep('fill'); setReviewResult(null) }}
                      className="btn-ghost text-sm"
                    >
                      返回修改
                    </button>
                    <button
                      onClick={() => setStep('done')}
                      className="btn-primary flex items-center gap-2 text-sm"
                    >
                      确认，进入创作
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 'done' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-green-400/20 flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} className="text-green-400" />
              </div>
              <h2 className="text-xl font-medium">一切就绪！</h2>
              <p className="text-sm text-white/40 leading-relaxed max-w-md mx-auto">
                你的创作空间已经准备好了。<br />
                智能交流中枢会陪伴你逐步完善世界观、人物、大纲和伏笔。<br />
                大纲永远是活的——随时可以在中枢中讨论修改。
              </p>
              <button
                onClick={handleEnterWorkbench}
                className="btn-primary flex items-center gap-2 text-sm mx-auto"
              >
                <BookOpen size={14} />
                进入创作工作台
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
