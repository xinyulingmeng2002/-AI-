import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Cpu, Plus, Trash2, Wifi, Star, ChevronDown, Palette } from 'lucide-react'
import { useModelConfigStore, type ModelConfigEntry } from '@/stores/model-config'
import { PROVIDER_PRESETS, TASK_DEFAULTS, type ModelProvider, type TaskType } from '@mindforge/core'

function AddModelForm({ onClose }: { onClose: () => void }) {
  const addModel = useModelConfigStore((s) => s.addModel)
  const [provider, setProvider] = useState<ModelProvider>('openai')
  const [modelName, setModelName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('')

  const preset = PROVIDER_PRESETS.find((p) => p.provider === provider)

  const handleProviderChange = (p: ModelProvider) => {
    setProvider(p)
    const newPreset = PROVIDER_PRESETS.find((pr) => pr.provider === p)
    setBaseUrl(newPreset?.defaultBaseUrl ?? '')
    setModelName(newPreset?.defaultModels[0] ?? '')
  }

  const handleSubmit = () => {
    if (!modelName.trim()) return
    const p = preset!
    addModel({
      provider,
      providerName: p.name,
      modelName: modelName.trim(),
      apiKey,
      baseUrl: baseUrl || p.defaultBaseUrl,
      temperature: 0.7,
      maxTokens: 4096,
      topP: 1.0
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface border border-white/10 rounded-xl p-6 w-[480px] max-h-[80vh] overflow-y-auto shadow-2xl">
        <h3 className="text-base font-medium mb-4">添加模型</h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50 block mb-1">提供商</label>
            <select
              className="input-field text-sm"
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as ModelProvider)}
            >
              {PROVIDER_PRESETS.map((p) => (
                <option key={p.provider} value={p.provider}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-white/50 block mb-1">模型名称</label>
            <div className="flex gap-2 flex-wrap">
              {preset?.defaultModels.map((m) => (
                <button
                  key={m}
                  onClick={() => setModelName(m)}
                  className={`px-2 py-1 text-xs rounded border transition-colors
                    ${modelName === m
                      ? 'border-accent-primary text-accent-primary bg-accent-primary/10'
                      : 'border-white/10 text-white/50 hover:border-white/20'
                    }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <input
              className="input-field text-sm mt-2"
              placeholder="或手动输入模型名..."
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
            />
          </div>

          {preset?.requiresApiKey !== false && (
            <div>
              <label className="text-xs text-white/50 block mb-1">API Key</label>
              <input
                type="password"
                className="input-field text-sm"
                placeholder="输入 API Key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="text-xs text-white/50 block mb-1">
              API 端点 {preset && <span className="text-white/20">（默认: {preset.defaultBaseUrl}）</span>}
            </label>
            <input
              className="input-field text-sm"
              placeholder={preset?.defaultBaseUrl ?? 'https://...'}
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="btn-ghost text-sm">取消</button>
          <button
            onClick={handleSubmit}
            className="btn-primary text-sm"
            disabled={!modelName.trim()}
          >
            添加
          </button>
        </div>
      </div>
    </div>
  )
}

export function SettingsPage() {
  const navigate = useNavigate()
  const {
    models, defaultModelId, taskMappings, testingConnection, testResult,
    removeModel, setDefaultModel, setTaskMapping, testConnection
  } = useModelConfigStore()
  const [showAddForm, setShowAddForm] = useState(false)

  return (
    <div className="h-full flex flex-col">
      <header className="h-10 bg-surface-light border-b border-white/5 flex items-center px-3 shrink-0">
        <button onClick={() => navigate('/')} className="btn-ghost p-1.5 mr-2">
          <ArrowLeft size={14} />
        </button>
        <span className="text-sm font-medium">设置</span>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* 模型配置 */}
        <section className="panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 text-sm font-medium">
              <Cpu size={14} className="text-accent-primary" />
              模型配置
            </h2>
            <button onClick={() => setShowAddForm(true)} className="btn-primary text-xs flex items-center gap-1">
              <Plus size={12} /> 添加模型
            </button>
          </div>

          {models.length === 0 ? (
            <div className="text-white/20 text-xs text-center py-8 leading-relaxed">
              还没有配置模型<br />
              点击"添加模型"接入你的 API
            </div>
          ) : (
            <div className="space-y-3">
              {models.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  isDefault={model.id === defaultModelId}
                  onSetDefault={() => setDefaultModel(model.id)}
                  onRemove={() => removeModel(model.id)}
                  onTest={() => testConnection(model.id)}
                  testing={testingConnection}
                />
              ))}
            </div>
          )}

          {testResult && (
            <div className={`mt-3 text-xs p-2 rounded ${
              testResult.startsWith('✅') ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
            }`}>
              {testResult}
            </div>
          )}

          {/* 任务级模型分配 */}
          {models.length > 0 && (
            <div className="mt-6 pt-4 border-t border-white/5">
              <h3 className="text-xs font-medium text-white/50 mb-3">任务级模型分配（可选）</h3>
              <div className="space-y-2">
                {(Object.entries(TASK_DEFAULTS) as [TaskType, { temperature: number; description: string }][]).map(([task, info]) => (
                  <div key={task} className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-white/70">{info.description}</span>
                    </div>
                    <select
                      className="bg-surface-lighter text-xs text-white/60 rounded px-2 py-1 border border-white/5"
                      value={taskMappings[task] ?? ''}
                      onChange={(e) => setTaskMapping(task, e.target.value || null)}
                    >
                      <option value="">跟随全局默认</option>
                      {models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.providerName} / {m.modelName}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 偏好设置 */}
        <section className="panel p-6">
          <h2 className="flex items-center gap-2 text-sm font-medium mb-4">
            <Palette size={14} className="text-accent-primary" />
            偏好设置
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">深色模式</span>
              <button
                onClick={() => document.documentElement.classList.toggle('dark')}
                className="bg-surface-lighter text-xs text-white/60 rounded px-3 py-1 border border-white/5 hover:text-white/80"
              >
                切换
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">数据备份</span>
              <button
                onClick={() => alert('备份功能：SQLite数据库文件位于应用数据目录中，可手动复制备份。\n\n自动备份功能将在v0.2中实现。')}
                className="bg-surface-lighter text-xs text-white/60 rounded px-3 py-1 border border-white/5 hover:text-white/80"
              >
                查看说明
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">导出作品数据</span>
              <button
                onClick={() => alert('导出功能将在v0.2中实现，支持TXT/Markdown/EPUB格式。')}
                className="bg-surface-lighter text-xs text-white/60 rounded px-3 py-1 border border-white/5 hover:text-white/80"
              >
                即将推出
              </button>
            </div>
          </div>
        </section>
      </div>

      {showAddForm && <AddModelForm onClose={() => setShowAddForm(false)} />}
    </div>
  )
}

function ModelCard({
  model, isDefault, onSetDefault, onRemove, onTest, testing
}: {
  model: ModelConfigEntry
  isDefault: boolean
  onSetDefault: () => void
  onRemove: () => void
  onTest: () => void
  testing: boolean
}) {
  return (
    <div className={`bg-surface-lighter rounded-lg p-3 border transition-colors
      ${isDefault ? 'border-accent-primary/30' : 'border-white/5'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" title="已配置" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{model.providerName}</span>
              <span className="text-xs text-white/40">{model.modelName}</span>
              {isDefault && (
                <span className="text-[10px] bg-accent-primary/20 text-accent-primary px-1.5 py-0.5 rounded">
                  默认
                </span>
              )}
            </div>
            <div className="text-[10px] text-white/30 mt-0.5">{model.baseUrl}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isDefault && (
            <button onClick={onSetDefault} className="btn-ghost p-1.5" title="设为默认">
              <Star size={12} />
            </button>
          )}
          <button
            onClick={onTest}
            disabled={testing}
            className="btn-ghost p-1.5"
            title="测试连接"
          >
            <Wifi size={12} className={testing ? 'animate-pulse' : ''} />
          </button>
          <button onClick={onRemove} className="btn-ghost p-1.5 hover:text-red-400" title="删除">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
