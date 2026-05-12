// 章纲要数据结构

export interface SceneBeat {
  order: number
  title: string
  description: string
  function: 'setup' | 'development' | 'turn' | 'climax' | 'hook'
  targetWordCount: number
  emotionalTone: string
}

export interface ForeshadowingOp {
  description: string
  expectedPayoffChapter: number | null
  importance: 'minor' | 'major' | 'critical'
}

export interface CharacterInChapter {
  characterId: string
  role: 'protagonist' | 'antagonist' | 'supporting' | 'cameo'
  statusChange: string
  pov: boolean
}

export interface EmotionalCurvePoint {
  beat: number
  emotion: string
  intensity: number
}

export interface ChapterOutline {
  chapterId: string
  volumeId: string
  chapterNumber: number
  title: string

  objective: {
    mainlineProgress: string
    subplotProgress: string[]
  }

  coreConflict: {
    type: 'character_vs_character' | 'character_vs_environment' | 'character_vs_self' | 'multi'
    description: string
    intensity: 1 | 2 | 3 | 4 | 5
  }

  characters: CharacterInChapter[]
  sceneBeats: SceneBeat[]

  foreshadowing: {
    planted: ForeshadowingOp[]
    recovered: string[]
  }

  targetWordCount: number
  emotionalCurve: EmotionalCurvePoint[]
  endingHook: string

  status: 'draft' | 'locked' | 'in_progress' | 'completed'
  source: 'user' | 'ai' | 'collaborative'
  version: number
  createdAt: string
  updatedAt: string
}

export interface VolumeOutline {
  volumeId: string
  volumeNumber: number
  title: string
  summary: string
  chapterIds: string[]
  status: 'draft' | 'in_progress' | 'completed'
}

export interface BookOutline {
  bookId: string
  title: string
  genre: string
  oneLiner: string
  volumes: VolumeOutline[]
  status: 'draft' | 'in_progress' | 'completed'
  createdAt: string
  updatedAt: string
}
