import { useEffect, useState, useRef, useCallback } from 'react'
import { useCharacterStore } from '@/stores/characters'
import { useWorkspaceStore } from '@/stores/workspace'
import type { Relationship } from '@mindforge/shared'
import { Users, Plus, X, Move } from 'lucide-react'
import { EmptyState, LoadingText } from '@/components/shared/Loading'

interface GraphNode {
  id: string; name: string; x: number; y: number
}

interface GraphEdge {
  from: string; to: string; label: string; color: string
}

const RELATION_COLORS: Record<string, string> = {
  '朋友': '#48cae4', '恋人': '#ff6b6b', '敌人': '#ff4444',
  '师徒': '#ffa726', '亲人': '#66bb6a', '盟友': '#42a5f5',
  '默认': '#6c63ff'
}

export function RelationshipGraph() {
  const { characters } = useCharacterStore()
  const currentWsId = useWorkspaceStore((s) => s.currentWorkspaceId)
  const [loading, setLoading] = useState(true)
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [addingEdge, setAddingEdge] = useState<{ from: string; to: string; label: string } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 从角色数据构建图谱
  useEffect(() => {
    buildGraph()
    setLoading(false)
  }, [characters, currentWsId])

  const buildGraph = async () => {
    // 从本地Store的characters构建节点
    const graphNodes: GraphNode[] = characters.map((c, i) => {
      const angle = (i / Math.max(characters.length, 1)) * Math.PI * 2
      const radius = Math.min(180, characters.length * 30)
      return {
        id: c.id,
        name: c.name,
        x: 200 + Math.cos(angle) * radius,
        y: 180 + Math.sin(angle) * radius
      }
    })
    setNodes(graphNodes)

    // 从角色关系构建连线
    const graphEdges: GraphEdge[] = []
    for (const c of characters) {
      for (const rel of c.relationships) {
        if (graphNodes.some((n) => n.id === rel.targetCharacterId)) {
          graphEdges.push({
            from: c.id,
            to: rel.targetCharacterId,
            label: rel.type,
            color: RELATION_COLORS[rel.type] ?? RELATION_COLORS['默认']
          })
        }
      }
    }
    setEdges(graphEdges)
  }

  const handleNodeDrag = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return
    const startNX = node.x
    const startNY = node.y

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      setNodes((prev) => prev.map((n) =>
        n.id === nodeId ? { ...n, x: startNX + dx, y: startNY + dy } : n
      ))
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [nodes])

  const startAddEdge = (fromId: string) => {
    setSelectedNode(fromId)
    setAddingEdge({ from: fromId, to: '', label: '盟友' })
  }

  const { updateCharacter } = useCharacterStore()

  const confirmEdge = () => {
    if (!addingEdge?.to) { setAddingEdge(null); return }
    const newEdge = {
      from: addingEdge.from,
      to: addingEdge.to,
      label: addingEdge.label,
      color: RELATION_COLORS[addingEdge.label] ?? RELATION_COLORS['默认']
    }
    setEdges((prev) => [...prev, newEdge])

    // 持久化到角色Store → 角色Store会自动写回DB
    const source = characters.find((c) => c.id === addingEdge.from)
    if (source) {
      const newRel = {
        targetCharacterId: addingEdge.to,
        type: addingEdge.label,
        description: '',
        intensity: 5,
        history: ''
      }
      const relationships: Relationship[] = [...(source.relationships || []), newRel]
      updateCharacter(addingEdge.from, { relationships })
    }

    setAddingEdge(null)
    setSelectedNode(null)
  }

  if (loading) return <LoadingText />
  if (characters.length === 0) {
    return <EmptyState>请先在人物档案中添加人物，系统会自动生成关系图谱。在智能交流中枢中描述人物关系也会自动提取。</EmptyState>
  }

  return (
    <div className="h-full flex flex-col" ref={containerRef}>
      {/* 工具栏 */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/5 text-[10px] text-white/30">
        <span>{nodes.length} 个节点 · {edges.length} 条关系</span>
        {selectedNode && (
          <span className="text-accent-primary">
            选中: {nodes.find((n) => n.id === selectedNode)?.name}
          </span>
        )}
      </div>

      {/* 图谱画布 */}
      <div className="flex-1 relative overflow-hidden bg-surface" style={{ minHeight: 300 }}>
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {edges.map((edge, i) => {
            const from = nodes.find((n) => n.id === edge.from)
            const to = nodes.find((n) => n.id === edge.to)
            if (!from || !to) return null
            const mx = (from.x + to.x) / 2
            const my = (from.y + to.y) / 2
            return (
              <g key={i}>
                <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={edge.color} strokeWidth={1.5} opacity={0.6} />
                <text x={mx} y={my} fill={edge.color} fontSize={9} textAnchor="middle"
                  className="pointer-events-auto" style={{ paintOrder: 'stroke', stroke: '#1a1a2e', strokeWidth: 2 }}>
                  {edge.label}
                </text>
              </g>
            )
          })}
        </svg>

        {nodes.map((node) => (
          <div
            key={node.id}
            onMouseDown={(e) => handleNodeDrag(e, node.id)}
            onClick={() => selectedNode === node.id ? startAddEdge(node.id) : setSelectedNode(node.id)}
            className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing
              flex flex-col items-center gap-1 group select-none`}
            style={{ left: node.x, top: node.y }}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium
              transition-all duration-200
              ${selectedNode === node.id
                ? 'bg-accent-primary text-white ring-2 ring-accent-primary/50 scale-110'
                : 'bg-surface-lighter text-white/70 hover:bg-surface-lighter/80'
              }`}>
              {node.name[0]}
            </div>
            <span className="text-[9px] text-white/50 whitespace-nowrap">{node.name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); startAddEdge(node.id) }}
              className="opacity-0 group-hover:opacity-100 btn-ghost p-0.5 absolute -top-1 -right-1"
              title="添加关系"
            >
              <Plus size={9} />
            </button>
          </div>
        ))}
      </div>

      {/* 添加关系弹窗 */}
      {addingEdge && (
        <div className="absolute bottom-3 left-3 right-3 bg-surface-light border border-white/10 rounded-lg p-3 z-10">
          <div className="text-xs text-white/50 mb-2">
            从「{nodes.find(n => n.id === addingEdge.from)?.name}」添加关系
          </div>
          <div className="flex gap-2 items-center">
            <select className="input-field text-xs flex-1 py-1" value={addingEdge.to}
              onChange={(e) => setAddingEdge({ ...addingEdge, to: e.target.value })}>
              <option value="">选择目标人物...</option>
              {nodes.filter(n => n.id !== addingEdge.from).map(n => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
            <select className="input-field text-xs w-20 py-1" value={addingEdge.label}
              onChange={(e) => setAddingEdge({ ...addingEdge, label: e.target.value })}>
              {Object.keys(RELATION_COLORS).filter(k => k !== '默认').map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            <button onClick={confirmEdge} className="btn-primary text-[10px] px-2 py-1">确定</button>
            <button onClick={() => { setAddingEdge(null); setSelectedNode(null) }} className="btn-ghost text-[10px]">
              <X size={11} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
