import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageSquare, Send, User, Loader2 } from 'lucide-react'
import { sendChatMessage } from '@/services/chat-service'
import { tryExtract } from '@/services/extraction-service'
import { ExtractionCardComponent } from './ExtractionCard'
import { useModelConfigStore } from '@/stores/model-config'
import { useWorkspaceStore } from '@/stores/workspace'
import { applyExtractionCard } from '@/services/truth-files-service'
import type { ExtractionCard } from '@mindforge/core'

type AIIdentity = 'sister' | 'brother' | 'mentor'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  extractionCard?: ExtractionCard
}

const IDENTITY_CONFIG: Record<AIIdentity, {
  label: string
  avatar: string
  welcome: string
  systemPrompt: string
}> = {
  sister: {
    label: '知心小姐姐',
    avatar: '👩‍💻',
    welcome: '嗨～欢迎来到你的创作空间！我是你的知心小姐姐，会温柔地陪你一起构建这个世界。先跟我聊聊你的故事构想吧，想到什么都可以说哦～',
    systemPrompt: '你是一位温柔、善解人意的写作伙伴，语气亲切温暖，喜欢用"～"和"哦"等语气词。你会鼓励作者表达想法，从不催促，善于倾听和引导。你的知识面很广，但给出建议时会用"我觉得..."、"也许可以试试..."等委婉的表达。'
  },
  brother: {
    label: '知心小哥哥',
    avatar: '🧑‍💻',
    welcome: '哟，来了！我是你的创作搭子，咱们轻松点，一边聊一边把这个世界搭起来。说说看，你脑子里现在有什么想法？',
    systemPrompt: '你是一位幽默轻松的写作伙伴，语气像朋友一样自在，偶尔会开玩笑活跃气氛。你能快速理解作者的意图，用简单直接的方式给出建议。你不会装严肃，但讨论到专业问题时也能切换到认真模式。'
  },
  mentor: {
    label: '文学导师',
    avatar: '📚',
    welcome: '你好，我是你的文学导师。我们可以从叙事结构、人物弧光、世界观一致性等多个维度来探讨你的创作。请分享你的大纲和构想，我会给出专业的分析和建议。',
    systemPrompt: '你是一位资深的文学导师，专业严谨，对叙事学、人物塑造、世界观构建有深入研究。你会从结构层面分析作品，用专业但不晦涩的语言给出建议。你善于发现作品中的深层问题和潜力，引导作者走向更成熟的创作。'
  }
}

export function ChatHubPanel() {
  const [identity, setIdentity] = useState<AIIdentity>(() => {
    try { return (localStorage.getItem('mindforge_chat_identity') as AIIdentity) ?? 'sister' } catch { return 'sister' }
  })
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const models = useModelConfigStore((s) => s.models)
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)

  // 加载历史聊天记录
  useEffect(() => {
    if (!currentWorkspaceId) return
    const loadHistory = async () => {
      try {
        const result = await window.mindforge.db.getAll('chat_history', currentWorkspaceId)
        if (result.success && result.data && result.data.length > 0) {
          const msgs: ChatMessage[] = (result.data as Record<string, unknown>[])
            .sort((a, b) => (a.created_at as string).localeCompare(b.created_at as string))
            .map((r) => ({
              id: r.id as string,
              role: r.role as ChatMessage['role'],
              content: r.content as string
            }))
          setMessages(msgs)
        } else {
          // 无历史记录，显示欢迎消息
          const config = IDENTITY_CONFIG[identity]
          setMessages([{ id: 'welcome', role: 'assistant', content: config.welcome }])
        }
      } catch { /* DB可能不可用 */ }
      setHistoryLoaded(true)
    }
    loadHistory()
  }, [currentWorkspaceId])

  // 保存消息到数据库
  const saveMessage = async (msg: ChatMessage) => {
    if (!currentWorkspaceId || msg.id === 'welcome') return
    try {
      await window.mindforge.db.insert('chat_history', {
        id: msg.id,
        workspace_id: currentWorkspaceId,
        role: msg.role,
        content: msg.content,
        identity: identity
      })
    } catch { /* ignore */ }
  }

  // 更新消息时保存
  const updateAssistantMessage = (content: string) => {
    setMessages((prev) => {
      const updated = [...prev]
      const last = updated[updated.length - 1]
      if (last?.role === 'assistant') {
        last.content = content
        if (!content.startsWith('抱歉')) saveMessage(last)
      }
      return updated
    })
  }

  // 监听审核结果事件
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.message) {
        setMessages((prev) => [
          ...prev,
          {
            id: `audit_${Date.now()}`,
            role: 'system',
            content: detail.message
          }
        ])
      }
    }
    window.addEventListener('audit-result', handler)
    window.addEventListener('observer-result', handler)
    return () => {
      window.removeEventListener('audit-result', handler)
      window.removeEventListener('observer-result', handler)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleIdentityChange = (newIdentity: AIIdentity) => {
    setIdentity(newIdentity)
    try { localStorage.setItem('mindforge_chat_identity', newIdentity) } catch { /* ignore */ }
    // 只改变身份，不清除历史记录
    if (messages.length <= 1 && messages[0]?.id === 'welcome') {
      const config = IDENTITY_CONFIG[newIdentity]
      setMessages([{ id: 'welcome', role: 'assistant', content: config.welcome }])
    }
  }

  const handleSend = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: trimmed
    }

    const assistantMsg: ChatMessage = {
      id: `assistant_${Date.now()}`,
      role: 'assistant',
      content: ''
    }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setInput('')
    setIsStreaming(true)

    // 保存用户消息
    saveMessage(userMsg)

    // 从当前作品状态动态组装上下文
    const { buildHubContext } = await import('@/services/hub-context')
    const hubCtx = currentWorkspaceId
      ? await buildHubContext(currentWorkspaceId, identity)
      : null

    const config = IDENTITY_CONFIG[identity]
    const systemPrompt = hubCtx?.systemPrompt ?? config.systemPrompt

    // 构建消息历史给 AI
    const history = messages
      .filter((m) => m.role !== 'system' && m.id !== 'welcome')
      .map((m) => ({ role: m.role, content: m.content }))

    await sendChatMessage(
      [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: trimmed }
      ],
      {
        onToken: (token) => {
          setMessages((prev) => {
            const updated = [...prev]
            const last = updated[updated.length - 1]
            if (last?.role === 'assistant') last.content += token
            return updated
          })
        },
        onDone: (fullContent) => {
          updateAssistantMessage(fullContent)
          setIsStreaming(false)

          // 流式完成后，异步进行要素提取
          tryExtract(trimmed, {
            onCardGenerated: (card) => {
              setMessages((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  extractionCard: card
                }
                return updated
              })
            },
            onNoExtraction: () => {}
          })
        },
        onError: (error) => {
          updateAssistantMessage(`抱歉，出了点问题：${error.message}`)
          setIsStreaming(false)
        }
      }
    )
  }, [input, isStreaming, messages, identity])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleExtractionConfirm = async (cardId: string) => {
    // 找到对应的提取卡片
    let card: ExtractionCard | null = null
    setMessages((prev) => {
      const updated = prev.map((m) => {
        if (m.extractionCard?.id === cardId) {
          card = m.extractionCard
          return { ...m, extractionCard: { ...m.extractionCard, confirmed: true } }
        }
        return m
      })
      return updated
    })

    // 写入数据库
    if (card && currentWorkspaceId) {
      await applyExtractionCard(card, currentWorkspaceId)
    }
  }

  const handleExtractionReject = (cardId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.extractionCard?.id === cardId
          ? { ...m, extractionCard: undefined }
          : m
      )
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} />
          <span>智能交流中枢</span>
        </div>
        <select
          className="bg-surface-lighter text-xs text-white/60 rounded px-2 py-1 border border-white/5"
          value={identity}
          onChange={(e) => handleIdentityChange(e.target.value as AIIdentity)}
        >
          <option value="sister">知心小姐姐</option>
          <option value="brother">知心小哥哥</option>
          <option value="mentor">文学导师</option>
        </select>
      </div>

      {/* 聊天消息区 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {models.length === 0 && (
          <div className="text-xs text-yellow-400/70 bg-yellow-400/5 border border-yellow-400/10 rounded-lg p-3 mb-2">
            尚未配置 AI 模型，请先前往<strong>设置</strong>页面添加模型以启用对话功能。
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === 'system' ? (
              <div className="flex justify-center">
                <div className="bg-accent-secondary/10 border border-accent-secondary/20 rounded-lg px-4 py-3 text-xs text-white/70 max-w-[90%] leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </div>
              </div>
            ) : msg.role === 'user' ? (
              <div className="flex gap-2 justify-end">
                <div className="bg-accent-primary/15 rounded-lg rounded-tr-none px-3 py-2 text-sm text-white/80 max-w-[85%]">
                  {msg.content}
                </div>
                <div className="w-7 h-7 rounded-full bg-accent-warm/20 flex items-center justify-center shrink-0">
                  <User size={12} className="text-accent-warm" />
                </div>
              </div>
            ) : (
              <div>
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-accent-primary/20 flex items-center justify-center shrink-0 text-sm">
                    {IDENTITY_CONFIG[identity].avatar}
                  </div>
                  <div className="bg-surface-lighter rounded-lg rounded-tl-none px-3 py-2 text-sm text-white/70 max-w-[85%] leading-relaxed">
                    {msg.content || (
                      <span className="inline-flex items-center gap-1 text-white/30">
                        <Loader2 size={12} className="animate-spin" />
                        思考中...
                      </span>
                    )}
                  </div>
                </div>

                {/* 要素提取卡片 */}
                {msg.extractionCard && !msg.extractionCard.confirmed && (
                  <div className="ml-9 mt-1">
                    <ExtractionCardComponent
                      card={msg.extractionCard}
                      onConfirm={handleExtractionConfirm}
                      onReject={handleExtractionReject}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区 */}
      <div className="p-3 border-t border-white/5">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            className="input-field text-sm flex-1 chat-input"
            placeholder={
              models.length === 0
                ? '请先在设置中配置模型...'
                : '分享你的想法...'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming || models.length === 0}
          />
          <button
            className="btn-primary p-2 disabled:opacity-30"
            onClick={handleSend}
            disabled={!input.trim() || isStreaming || models.length === 0}
            title="发送"
          >
            {isStreaming ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
