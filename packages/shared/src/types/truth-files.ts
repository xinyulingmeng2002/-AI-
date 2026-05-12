// Truth Files — 结构化事实管理中心，单一事实源

export interface GeoRegion {
  id: string
  name: string
  description: string
  parentRegion: string | null
  subRegions: string[]
  features: string[]
}

export interface Faction {
  id: string
  name: string
  description: string
  leader: string
  members: string[]
  allies: string[]
  enemies: string[]
  territory: string[]
  resources: string[]
}

export interface PowerSystem {
  name: string
  description: string
  stages: Array<{
    name: string
    description: string
    abilities: string[]
    requirements: string
  }>
  rules: string[]
}

export interface WorldRule {
  id: string
  category: string
  description: string
  exceptions: string[]
}

export interface TimelineEvent {
  id: string
  name: string
  description: string
  chapterOccurred: number | null
  relativeTime: string
  affectsCharacters: string[]
  affectsRegions: string[]
}

export interface Conflict {
  id: string
  name: string
  parties: string[]
  description: string
  status: 'brewing' | 'active' | 'resolved'
  intensity: number
}

export interface WorldState {
  geography: GeoRegion[]
  factions: Faction[]
  powerSystem: PowerSystem
  rules: WorldRule[]
  history: TimelineEvent[]
  currentState: {
    activeConflicts: Conflict[]
    politicalSituation: string
    economicSituation: string
  }
}

// --- Character Matrix ---

export interface Trait {
  name: string
  intensity: number // 0-100
  description: string
}

export interface CharacterAbility {
  name: string
  level: string
  description: string
}

export interface Relationship {
  targetCharacterId: string
  type: string
  description: string
  intensity: number // -100 to 100
  history: string
}

export interface CharacterArc {
  stage: string
  progress: number // 0-100
  nextMilestone: string
}

export interface CharacterCurrentState {
  location: string
  status: string
  emotionalState: string
  lastAppearedChapter: number | null
}

export interface Character {
  id: string
  name: string
  aliases: string[]
  archetype: string
  personality: {
    traits: Trait[]
    mbti: string | null
    motivation: string
    fear: string
    flaw: string
  }
  background: string
  appearance: string
  speechStyle: string
  abilities: CharacterAbility[]
  relationships: Relationship[]
  arc: CharacterArc
  currentState: CharacterCurrentState
}

export interface CharacterMatrix {
  characters: Character[]
}

// --- Pending Hooks ---

export interface PendingHook {
  id: string
  description: string
  plantedChapter: number
  plantedContext: string
  expectedPayoffChapter: number | null
  actualPayoffChapter: number | null
  importance: 'minor' | 'major' | 'critical'
  status: 'pending' | 'partially_recovered' | 'recovered' | 'abandoned'
  relatedCharacters: string[]
  relatedSubplots: string[]
  notes: string
}

// --- Chapter Summary ---

export interface ChapterSummary {
  chapterId: string
  chapterNumber: number
  volumeNumber: number
  title: string
  summary: string
  keyEvents: string[]
  charactersAppeared: Array<{
    characterId: string
    statusChange: string
  }>
  hooksInvolved: string[]
  wordCount: number
  completedAt: string
}

// --- Subplot Board ---

export interface Subplot {
  id: string
  name: string
  description: string
  relatedCharacters: string[]
  status: 'planned' | 'active' | 'resolved' | 'abandoned'
  progress: number // 0-100
  introducedChapter: number | null
  resolvedChapter: number | null
}

export interface SubplotBoard {
  subplots: Subplot[]
}

// --- Emotional Arcs ---

export interface EmotionalArcPoint {
  chapterNumber: number
  emotion: string
  intensity: number
  trigger: string
}

export interface EmotionalArc {
  characterId: string
  arcPoints: EmotionalArcPoint[]
}

// --- Resource Ledger ---

export interface ResourceItem {
  id: string
  name: string
  type: string
  description: string
  quantity: number | null
  owner: string | null
  acquiredChapter: number | null
  status: 'available' | 'consumed' | 'lost' | 'destroyed'
}

export interface ResourceLedger {
  items: ResourceItem[]
}
