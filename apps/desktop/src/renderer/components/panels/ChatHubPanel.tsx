import { MessageSquare, Send, User } from 'lucide-react'

export function ChatHubPanel() {
  return (
    <div className="h-full flex flex-col">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} />
          <span>智能交流中枢</span>
        </div>
        <select className="bg-surface-lighter text-xs text-white/60 rounded px-2 py-1 border border-white/5">
          <option>知心小姐姐</option>
          <option>知心小哥哥</option>
          <option>文学导师</option>
        </select>
      </div>

      {/* 聊天消息区 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* 欢迎消息 */}
        <div className="flex gap-2">
          <div className="w-7 h-7 rounded-full bg-accent-primary/20 flex items-center justify-center shrink-0">
            <MessageSquare size={12} className="text-accent-primary" />
          </div>
          <div className="bg-surface-lighter rounded-lg rounded-tl-none px-3 py-2 text-sm text-white/70 max-w-[85%]">
            你好！我已经准备好陪你一起构建这个世界了。
            跟我说说你的故事构想吧，或者我们也可以从你已有的大纲开始聊起~
          </div>
        </div>

        {/* 占位提示 */}
        <div className="text-white/20 text-xs text-center py-8 leading-relaxed">
          —— 在此与 AI 朋友式聊天 ——<br />
          它会一步步引导你完善<br />
          世界观、人物、大纲、伏笔……
        </div>
      </div>

      {/* 输入区 */}
      <div className="p-3 border-t border-white/5">
        <div className="flex gap-2">
          <input
            className="input-field text-sm flex-1"
            placeholder="分享你的想法..."
          />
          <button className="btn-primary p-2" title="发送">
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
