import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Target, TrendingUp, Clock, BookOpen, Loader2 } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace'
import { useWritingGoalStore } from '@/stores/writing-goal'
import { getWritingStats, type WritingStats } from '@/services/stats-service'

export function DashboardPage() {
  const navigate = useNavigate()
  const { workspaces, loadWorkspaces } = useWorkspaceStore()
  const [stats, setStats] = useState<WritingStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWorkspaces().then(() => setLoading(false))
  }, [])

  useEffect(() => {
    getWritingStats().then(setStats)
  }, [workspaces])

  return (
    <div className="h-full flex flex-col">
      <header className="h-10 bg-surface-light border-b border-white/5 flex items-center px-3 shrink-0">
        <button onClick={() => navigate('/')} className="btn-ghost p-1.5 mr-2">
          <ArrowLeft size={14} />
        </button>
        <span className="text-sm font-medium">个人仪表盘</span>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 size={24} className="animate-spin text-white/20" />
          </div>
        ) : (
          <>
            {/* 统计卡片 */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <StatCard
                icon={<BookOpen size={18} />}
                label="总字数"
                value={stats?.totalWords.toLocaleString() ?? '0'}
                color="text-accent-primary"
              />
              <StatCard
                icon={<Target size={18} />}
                label="总章节"
                value={`${stats?.totalChapters ?? 0} 章`}
                color="text-accent-secondary"
              />
              <StatCard
                icon={<TrendingUp size={18} />}
                label="今日写作"
                value={`${stats?.todayWords.toLocaleString() ?? '0'} 字`}
                color="text-green-400"
              />
              <StatCard
                icon={<Clock size={18} />}
                label="连续天数"
                value={`${stats?.streak ?? 0} 天`}
                color="text-accent-warm"
              />
            </div>

            {/* 每日目标进度 */}
            <DailyGoalProgress stats={stats} />

            {/* 作品列表 */}
            <div className="panel p-6 mb-6">
              <h3 className="text-sm font-medium mb-4">作品概览</h3>
              {workspaces.length === 0 ? (
                <div className="text-white/20 text-xs text-center py-8">
                  还没有作品，在首页创建第一个作品
                </div>
              ) : (
                <div className="space-y-2">
                  {workspaces.map((ws) => (
                    <div
                      key={ws.id}
                      onClick={() => navigate(`/workbench/${ws.id}`)}
                      className="flex items-center justify-between p-3 bg-surface-lighter rounded-lg cursor-pointer hover:bg-surface-lighter/70 transition-colors"
                    >
                      <div>
                        <div className="text-sm font-medium">{ws.title}</div>
                        <div className="text-[11px] text-white/30 mt-0.5">
                          {ws.genre} · {ws.oneLiner?.slice(0, 40) ?? '暂无简介'}
                        </div>
                      </div>
                      <div className="text-xs text-white/30">
                        {new Date(ws.updatedAt).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 最近更新 */}
            {stats?.lastWriteDate && (
              <div className="panel p-6">
                <h3 className="text-sm font-medium mb-4">写作状态</h3>
                <div className="text-xs text-white/50 space-y-2">
                  <div className="flex justify-between">
                    <span>最近写作日期</span>
                    <span>{new Date(stats.lastWriteDate).toLocaleDateString('zh-CN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>连续写作天数</span>
                    <span className="text-accent-warm">{stats.streak} 天</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string; color: string
}) {
  return (
    <div className="panel p-4">
      <div className={`${color} mb-2`}>{icon}</div>
      <div className="text-xs text-white/40">{label}</div>
      <div className="text-lg font-semibold mt-1">{value}</div>
    </div>
  )
}

function DailyGoalProgress({ stats }: { stats: WritingStats | null }) {
  const { dailyGoal, setDailyGoal, todayWritten, setTodayWritten, goalMet } = useWritingGoalStore()
  const [editing, setEditing] = useState(false)
  const [inputGoal, setInputGoal] = useState(String(dailyGoal))

  useEffect(() => {
    if (stats) setTodayWritten(stats.todayWords)
  }, [stats])

  const progress = dailyGoal > 0 ? Math.min(100, Math.round((todayWritten / dailyGoal) * 100)) : 0

  const handleSaveGoal = () => {
    const n = parseInt(inputGoal, 10)
    if (n > 0) { setDailyGoal(n); setEditing(false) }
  }

  return (
    <div className="panel p-6 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">今日写作进度</h3>
        {editing ? (
          <div className="flex gap-1">
            <input className="input-field text-xs w-20 py-1" type="number"
              value={inputGoal} onChange={(e) => setInputGoal(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveGoal(); if (e.key === 'Escape') setEditing(false) }}
              autoFocus />
            <button onClick={handleSaveGoal} className="btn-primary text-[10px] px-2">确定</button>
          </div>
        ) : (
          <button onClick={() => { setInputGoal(String(dailyGoal)); setEditing(true) }}
            className="text-xs text-white/30 hover:text-white/60">
            目标：{dailyGoal.toLocaleString()} 字
          </button>
        )}
      </div>
      <div className="bg-surface-lighter rounded-full h-3 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${
          goalMet ? 'bg-green-400' : 'bg-accent-primary'
        }`} style={{ width: `${progress}%` }} />
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-white/30">
        <span>{todayWritten.toLocaleString()} / {dailyGoal.toLocaleString()} 字</span>
        <span>{goalMet ? '✅ 今日目标达成！' : `${progress}%`}</span>
      </div>
    </div>
  )
}
