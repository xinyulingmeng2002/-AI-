import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Target, TrendingUp, Clock, BookOpen } from 'lucide-react'

export function DashboardPage() {
  const navigate = useNavigate()

  return (
    <div className="h-full flex flex-col">
      <header className="h-10 bg-surface-light border-b border-white/5 flex items-center px-3 shrink-0">
        <button onClick={() => navigate('/')} className="btn-ghost p-1.5 mr-2">
          <ArrowLeft size={14} />
        </button>
        <span className="text-sm font-medium">个人仪表盘</span>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { icon: <BookOpen size={18} />, label: '总字数', value: '0', color: 'text-accent-primary' },
            { icon: <Target size={18} />, label: '今日目标', value: '0/4000', color: 'text-accent-secondary' },
            { icon: <TrendingUp size={18} />, label: '写作速度', value: '0 字/时', color: 'text-green-400' },
            { icon: <Clock size={18} />, label: '连续天数', value: '0 天', color: 'text-accent-warm' }
          ].map((card, i) => (
            <div key={i} className="panel p-4">
              <div className={`${card.color} mb-2`}>{card.icon}</div>
              <div className="text-xs text-white/40">{card.label}</div>
              <div className="text-lg font-semibold mt-1">{card.value}</div>
            </div>
          ))}
        </div>

        {/* 写作日历占位 */}
        <div className="panel p-6 mb-6">
          <h3 className="text-sm font-medium mb-4">写作日历</h3>
          <div className="text-white/20 text-xs text-center py-12">
            写作日历将在积累数据后展示每日写作热力分布
          </div>
        </div>

        {/* 近期作品 */}
        <div className="panel p-6">
          <h3 className="text-sm font-medium mb-4">近期作品</h3>
          <div className="text-white/20 text-xs text-center py-8">
            创建第一个作品后，将在此展示
          </div>
        </div>
      </div>
    </div>
  )
}
