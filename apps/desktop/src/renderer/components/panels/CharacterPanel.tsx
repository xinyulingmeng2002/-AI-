import { useState } from 'react'
import { useCharacterStore } from '@/stores/characters'
import { Plus, Trash2, Edit3, User, MapPin, Heart } from 'lucide-react'
import { CharacterEditor } from './CharacterEditor'

export function CharacterPanel() {
  const { characters, addCharacter, removeCharacter, editingId, setEditing } = useCharacterStore()
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAdd = () => {
    const name = newName.trim()
    if (!name) return
    addCharacter(name)
    setNewName('')
    setAdding(false)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-2 py-1.5">
        <span className="text-[10px] text-white/30">{characters.length} 个人物</span>
        <button onClick={() => setAdding(true)} className="btn-ghost p-1">
          <Plus size={13} />
        </button>
      </div>

      {adding && (
        <div className="flex gap-1 px-2 pb-2">
          <input
            className="input-field text-xs flex-1 py-1"
            placeholder="人物名称..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') setAdding(false)
            }}
            autoFocus
          />
          <button onClick={handleAdd} className="btn-primary text-[10px] px-2">确定</button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {characters.length === 0 ? (
          <div className="text-white/20 text-[11px] text-center py-8 leading-relaxed">
            还没有人物<br />
            点击 <Plus size={10} className="inline" /> 添加<br />
            或在智能交流中枢中聊天时自动填充
          </div>
        ) : (
          <div className="space-y-1">
            {characters.map((char) => (
              <div
                key={char.id}
                onClick={() => setEditing(char.id)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer group
                  transition-colors text-xs
                  ${editingId === char.id
                    ? 'bg-accent-primary/15 text-accent-primary'
                    : 'text-white/60 hover:bg-white/5'
                  }`}
              >
                <div className="w-6 h-6 rounded-full bg-surface-lighter flex items-center justify-center shrink-0 text-[10px]">
                  <User size={11} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{char.name}</div>
                  {char.archetype && (
                    <div className="text-[9px] text-white/25 truncate">{char.archetype}</div>
                  )}
                </div>
                <div className="flex items-center gap-0.5 text-[9px] text-white/20">
                  {char.currentState.location && <MapPin size={9} />}
                  {char.personality.motivation && <Heart size={9} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
