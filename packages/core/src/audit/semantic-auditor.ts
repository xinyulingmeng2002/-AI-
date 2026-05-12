// LLM 深度语义一致性审计

import type { AuditIssue, AuditResult } from '@mindforge/shared'

export interface SemanticAuditContext {
  chapterContent: string        // 本章正文
  chapterOutline: string         // 章纲要（JSON序列化）
  characterProfiles: string      // 出场人物档案
  worldRules: string             // 相关世界观规则
  previousChapterSummary: string // 前一章摘要
  pendingHooks: string           // 待回收伏笔列表
}

export const SEMANTIC_AUDIT_PROMPT = `你是一位专业的网文审核师。请从以下维度对本章进行语义级深度审核：

## 审核维度

1. **人物OOC检测**：人物言行是否符合其性格设定？说话风格是否突变？能力是否与当前修炼进度匹配？
2. **力量体系一致性**：功法/技能/等级的使用是否符合世界规则？有没有越级使用或前后矛盾？
3. **世界观逻辑**：环境描述、势力关系、社会规则是否前后一致？
4. **伏笔操作**：本章埋设的伏笔是否合理？计划回收的伏笔是否真正回收？
5. **情感弧线**：人物情感变化是否自然？有没有突兀的情绪转折？
6. **对话一致性**：每个角色的对话是否符合其身份、性格和说话风格？
7. **设定连续性**：时间、地点、人物状态是否与前一章衔接？
8. **剧情逻辑**：因果链是否完整？有没有逻辑漏洞？

## 输出格式

请严格按以下 JSON 格式输出（不要包含其他内容）：

{
  "overallScore": 85,
  "summary": "总体评价（1-2句话）",
  "issues": [
    {
      "dimension": "人物OOC检测",
      "severity": "warning",
      "description": "具体问题描述",
      "suggestion": "修复建议",
      "location": "正文中的位置描述"
    }
  ]
}

## 注意
- severity 只能是 "critical"、"warning"、"suggestion"
- 不要过度挑剔，只报告真正的问题
- 给出具体的、可操作的修复建议
- 如果某维度没有问题，不要强行找问题`

export function buildSemanticAuditContext(context: SemanticAuditContext): string {
  return `## 章纲要
${context.chapterOutline}

## 出场人物档案
${context.characterProfiles || '（无）'}

## 相关世界观规则
${context.worldRules || '（无）'}

## 前一章摘要
${context.previousChapterSummary || '（无）'}

## 待回收伏笔
${context.pendingHooks || '（无）'}

## 本章正文（前5000字）
${context.chapterContent.slice(0, 5000)}`
}

export function parseSemanticAuditResponse(jsonStr: string): {
  overallScore: number
  summary: string
  issues: AuditIssue[]
} | null {
  try {
    const parsed = JSON.parse(jsonStr)
    return {
      overallScore: Math.max(0, Math.min(100, parsed.overallScore ?? 80)),
      summary: parsed.summary ?? '',
      issues: (parsed.issues ?? []).map((issue: Record<string, unknown>, i: number) => ({
        id: `sem_audit_${i}`,
        category: 'semantic',
        dimension: (issue.dimension as string) ?? '未知维度',
        severity: (issue.severity as AuditIssue['severity']) ?? 'suggestion',
        description: (issue.description as string) ?? '',
        location: (issue.location as string) ?? null,
        suggestion: (issue.suggestion as string) ?? '',
        affectedModules: []
      }))
    }
  } catch {
    return null
  }
}

export function mergeAuditResults(
  ruleResult: AuditResult,
  semanticResult: { overallScore: number; summary: string; issues: AuditIssue[] }
): AuditResult {
  const allIssues = [...ruleResult.issues, ...semanticResult.issues]
  const score = Math.round((ruleResult.overallScore * 0.4) + (semanticResult.overallScore * 0.6))
  const criticalCount = allIssues.filter((i) => i.severity === 'critical').length

  return {
    chapterId: ruleResult.chapterId,
    issues: allIssues,
    overallScore: score,
    isPassable: criticalCount === 0
  }
}
