// LLM语义审核服务

import { createRouter } from '@mindforge/core'
import {
  SEMANTIC_AUDIT_PROMPT, buildSemanticAuditContext, parseSemanticAuditResponse,
  mergeAuditResults, type SemanticAuditContext
} from '@mindforge/core'
import { useModelConfigStore } from '@/stores/model-config'
import type { AuditResult } from '@mindforge/shared'
import { triggerAudit } from './audit-service'

export async function runSemanticAudit(
  ruleResult: AuditResult,
  context: SemanticAuditContext
): Promise<AuditResult> {
  const store = useModelConfigStore.getState()
  const configs = store.toCoreConfigs()
  if (configs.length === 0) return ruleResult

  const router = createRouter(configs, store.defaultModelId)

  try {
    const response = await router.chat('audit', [
      { role: 'system', content: SEMANTIC_AUDIT_PROMPT },
      { role: 'user', content: buildSemanticAuditContext(context) }
    ])

    const jsonStr = response.content.match(/\{[\s\S]*\}/)?.[0]
    if (!jsonStr) return ruleResult

    const semanticResult = parseSemanticAuditResponse(jsonStr)
    if (!semanticResult) return ruleResult

    return mergeAuditResults(ruleResult, semanticResult)
  } catch {
    return ruleResult
  }
}

export function formatSemanticReport(result: AuditResult): string {
  const semanticIssues = result.issues.filter((i) => i.category === 'semantic')
  const ruleIssues = result.issues.filter((i) => i.category !== 'semantic')

  let msg = `## 深度审核报告 (规则 + LLM语义)\n\n**综合评分：${result.overallScore}/100**`
  msg += `\n- 规则引擎：${ruleIssues.length} 个问题`
  msg += `\n- 语义分析：${semanticIssues.length} 个问题`

  if (semanticIssues.length > 0) {
    msg += '\n\n### 🧠 LLM语义分析\n'
    const byDim = semanticIssues.reduce<Record<string, typeof semanticIssues>>((acc, i) => {
      (acc[i.dimension] ??= []).push(i); return acc
    }, {})
    for (const [dim, issues] of Object.entries(byDim)) {
      msg += `\n**${dim}**\n`
      issues.forEach((i) => {
        msg += `- ${i.description}\n  → ${i.suggestion}\n`
      })
    }
  }

  return msg
}
