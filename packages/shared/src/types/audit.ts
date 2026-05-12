// 一致性校验引擎类型定义

export type AuditSeverity = 'critical' | 'warning' | 'suggestion'

export interface AuditIssue {
  id: string
  category: string
  dimension: string
  severity: AuditSeverity
  description: string
  location: string | null
  suggestion: string
  affectedModules: string[]
}

export interface AuditResult {
  chapterId: string
  issues: AuditIssue[]
  overallScore: number // 0-100
  isPassable: boolean
}

// 冲突处理级别
export type ConflictLevel = 'none' | 'minor' | 'moderate' | 'severe'

export interface ChangeImpact {
  level: ConflictLevel
  affectedModules: string[]
  affectedCharacters: string[]
  affectedChapters: number[]
  description: string
  recommendation: 'auto_apply' | 'suggest_fix' | 'warn_and_confirm' | 'reject'
}
