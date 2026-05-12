import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Cpu, Key, Palette, Globe } from 'lucide-react'

export function SettingsPage() {
  const navigate = useNavigate()

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
          <h2 className="flex items-center gap-2 text-sm font-medium mb-4">
            <Cpu size={14} className="text-accent-primary" />
            模型配置
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/50 block mb-1">全局默认模型</label>
              <div className="flex gap-2">
                <select className="input-field flex-1 text-sm">
                  <option>OpenAI</option>
                  <option>Anthropic</option>
                  <option>DeepSeek</option>
                  <option>智谱 GLM</option>
                  <option>通义千问</option>
                  <option>Ollama (本地)</option>
                  <option>自定义 API</option>
                </select>
                <select className="input-field flex-1 text-sm">
                  <option>gpt-4o</option>
                  <option>gpt-4-turbo</option>
                  <option>gpt-4o-mini</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">API Key</label>
              <input type="password" className="input-field text-sm" placeholder="sk-..." />
            </div>
            <button className="btn-primary text-sm">测试连接</button>
          </div>
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
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">字体大小</span>
              <select className="input-field w-auto text-sm">
                <option>14px</option>
                <option>16px</option>
                <option>18px</option>
              </select>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
