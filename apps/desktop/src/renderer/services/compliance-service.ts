// 敏感内容合规 2.0 — 正则快速扫描 + LLM深度审核

import { createRouter } from '@mindforge/core'
import { useModelConfigStore } from '@/stores/model-config'
import { detectSensitiveWords, type SensitiveMatch } from './sensitive-words'

export interface ComplianceResult {
  riskLevel: 'safe' | 'low' | 'medium' | 'high'
  ruleMatches: SensitiveMatch[]
  llmAssessment: string | null
  suggestions: string[]
  score: number // 0-100, higher = safer
}

const COMPLIANCE_LLM_PROMPT = `你是网文内容合规审核专家。请分析以下文本是否存在违规风险。

## 风险评估维度
1. 政治敏感：是否涉及敏感政治内容或隐喻
2. 色情暴力：是否包含露骨描写
3. 价值观：是否宣扬不良价值观
4. 语境判断：某些词汇在特定语境下是否合法（如历史、玄幻背景）

## 输出JSON格式
{
  "riskLevel": "safe|low|medium|high",
  "assessment": "简要评价（1-2句）",
  "suggestions": ["具体修改建议"]
}`

export async function runComplianceCheck(text: string): Promise<ComplianceResult> {
  // Layer 1: 正则快速扫描
  const ruleMatches = detectSensitiveWords(text)

  // Layer 2: LLM深度审核
  let llmAssessment: string | null = null
  let suggestions: string[] = []
  let llmRiskLevel = 'safe'

  const store = useModelConfigStore.getState()
  const configs = store.toCoreConfigs()
  if (configs.length > 0) {
    try {
      const router = createRouter(configs, store.defaultModelId)
      const response = await router.chat('audit', [
        { role: 'system', content: COMPLIANCE_LLM_PROMPT },
        { role: 'user', content: text.slice(0, 3000) }
      ])
      const jsonStr = response.content.match(/\{[\s\S]*\}/)?.[0]
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr)
        llmAssessment = parsed.assessment ?? null
        suggestions = parsed.suggestions ?? []
        llmRiskLevel = parsed.riskLevel ?? 'safe'
      }
    } catch { /* LLM不可用时降级 */ }
  }

  // 综合评估
  const ruleRisk = ruleMatches.some((m) => m.severity === 'high') ? 'high' :
                   ruleMatches.length > 0 ? 'medium' : 'safe'

  const finalRisk = ruleRisk === 'high' || llmRiskLevel === 'high' ? 'high' :
                    ruleRisk === 'medium' || llmRiskLevel === 'medium' ? 'medium' :
                    llmRiskLevel === 'low' || ruleMatches.length > 0 ? 'low' : 'safe'

  const riskScores = { safe: 95, low: 75, medium: 50, high: 25 }
  const score = Math.max(0, riskScores[finalRisk] - ruleMatches.length * 2)

  return { riskLevel: finalRisk as ComplianceResult['riskLevel'], ruleMatches, llmAssessment, suggestions, score }
}

export function formatComplianceReport(result: ComplianceResult): string {
  let report = `## 内容合规检查\n\n**综合评分：${result.score}/100** | 风险等级：${
    result.riskLevel === 'safe' ? '🟢 安全' :
    result.riskLevel === 'low' ? '🟡 低风险' :
    result.riskLevel === 'medium' ? '🟠 中风险' : '🔴 高风险'
  }`

  if (result.ruleMatches.length > 0) {
    report += `\n\n### 规则匹配 (${result.ruleMatches.length}处)`
    result.ruleMatches.forEach((m) => {
      report += `\n- \`${m.word}\` — ${m.label} (${m.severity === 'high' ? '高风险' : '中风险'})`
    })
  }

  if (result.llmAssessment) {
    report += `\n\n### AI深度评估\n${result.llmAssessment}`
  }

  if (result.suggestions.length > 0) {
    report += '\n\n### 修改建议'
    result.suggestions.forEach((s) => { report += `\n- ${s}` })
  }

  return report
}
