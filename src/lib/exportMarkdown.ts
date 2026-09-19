import type { Assessment } from '../types'
import { PROVIDERS } from './constants'

export function buildMarkdown(
  assessment: Assessment,
  jd: string,
  candidateName?: string,
): string {
  const time = new Date(assessment.generatedAt).toLocaleString('zh-CN', {
    hour12: false,
  })
  const title = candidateName?.trim()
    ? `候选人：${candidateName.trim()}`
    : '候选人胜任力评估报告'

  const lines: string[] = []
  lines.push(`# ${title}`)
  lines.push('')
  lines.push(
    `> AI Talent Copilot · Competency Engine ｜ ${PROVIDERS[assessment.provider].label} · ${assessment.model} ｜ 生成时间：${time}`,
  )
  if (assessment.provider === 'demo') {
    lines.push('>')
    lines.push(
      '> ⚠️ 本报告由**免费体验模式（本地胜任力引擎 v2）**生成，仅供产品体验，不代表真实 AI 评估结论。',
    )
  }
  lines.push('')

  /* 一、综合结论 */
  lines.push('## 一、综合评估结论')
  lines.push('')
  if (assessment.categoryLabel) {
    lines.push(`- **岗位类别：** ${assessment.categoryLabel}`)
  }
  lines.push(`- **综合评分：${assessment.score} / 100（${assessment.band}）**`)
  lines.push(`- **评分方法：** Evidence Extraction → Competency Mapping → 证据强度 × 置信度 × 权重 加权聚合`)
  lines.push(`- **核心结论：** ${assessment.summary}`)
  lines.push('')

  /* 二、四大胜任力域 */
  lines.push('## 二、四大胜任力域评分')
  lines.push('')
  lines.push('| 胜任力域 | 权重 | 得分 | 置信度 | 评分依据 |')
  lines.push('| --- | --- | --- | --- | --- |')
  for (const d of assessment.domainScores) {
    const rationale = d.rationale.replace(/\|/g, '\\|').replace(/\n/g, ' ')
    lines.push(
      `| ${d.label}（${d.enLabel}） | ${d.weight}% | ${d.score} | ${Math.round(d.confidence * 100)}% | ${rationale} |`,
    )
  }
  lines.push('')

  /* 三、六维雷达 */
  lines.push('## 三、六维能力雷达')
  lines.push('')
  lines.push('| 维度 | 得分 |')
  lines.push('| --- | --- |')
  for (const r of assessment.radar) {
    lines.push(`| ${r.label}（${r.enLabel}） | ${r.score} |`)
  }
  lines.push('')

  /* 四、行为证据链 */
  lines.push('## 四、行为证据链（Evidence）')
  lines.push('')
  lines.push('| # | 简历原文证据 | 映射胜任力 | 所属域 | 强度/5 | 置信度 |')
  lines.push('| --- | --- | --- | --- | --- | --- |')
  const domainLabel: Record<string, string> = {
    hardSkill: '专业能力',
    cognitive: '认知能力',
    behavioral: '行为胜任力',
    roleFit: '岗位匹配',
  }
  for (const e of assessment.evidence) {
    const raw = e.rawText.replace(/\|/g, '\\|').replace(/\n/g, ' ')
    lines.push(
      `| ${e.id} | ${raw} | ${e.competency} | ${domainLabel[e.domain] ?? e.domain} | ${e.strength} | ${Math.round(e.confidence * 100)}% |`,
    )
  }
  lines.push('')

  /* 五、核心优势 */
  lines.push('## 五、核心优势（Highlights）')
  lines.push('')
  assessment.highlights.forEach((h, i) => {
    lines.push(`${i + 1}. **${h.evidence}**`)
    if (h.whyItMatters) lines.push(`   - 为何重要：${h.whyItMatters}`)
  })
  lines.push('')

  /* 六、Gap 分析 */
  lines.push('## 六、Gap 分析')
  lines.push('')
  lines.push('### 优势 Strengths')
  lines.push('')
  assessment.gapAnalysis.strengths.forEach((s) => lines.push(`- ${s}`))
  lines.push('')
  lines.push('### 差距 Gaps')
  lines.push('')
  assessment.gapAnalysis.gaps.forEach((g) => lines.push(`- ${g}`))
  lines.push('')
  lines.push(`> **Hiring Recommendation：** ${assessment.gapAnalysis.recommendation}`)
  lines.push('')

  /* 七、风险 */
  lines.push('## 七、潜在风险与待核实疑点（Risks）')
  lines.push('')
  assessment.risks.forEach((r) => {
    const tag = r.severity === 'critical' ? '🔴 重点核实' : '🟡 建议关注'
    lines.push(`- **${tag}：** ${r.text}`)
  })
  lines.push('')

  /* 八、BEI 面试题 */
  lines.push('## 八、BEI 行为面试提问库（STAR）')
  lines.push('')
  assessment.questions.forEach((q, i) => {
    lines.push(`### Q${i + 1}｜考察：${q.competency}`)
    lines.push('')
    if (q.reason) lines.push(`- **出题原因：** ${q.reason}`)
    lines.push(`- **提问：** ${q.question}`)
    lines.push(`- **追问建议：** ${q.followUp}`)
    lines.push('')
  })

  lines.push('---')
  lines.push('')
  if (jd.trim()) {
    lines.push('### 附：岗位 JD（节选）')
    lines.push('')
    lines.push('```text')
    lines.push(jd.trim().slice(0, 800))
    lines.push('```')
  }
  return lines.join('\n')
}

export function downloadMarkdown(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  textarea.remove()
}
