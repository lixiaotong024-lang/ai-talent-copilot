import type { Assessment, CompetencyDimension } from '../types'
import { PROVIDERS } from './constants'

export function buildMarkdown(
  assessment: Assessment,
  jd: string,
  dimensions: CompetencyDimension[],
  candidateName?: string,
): string {
  const time = new Date(assessment.generatedAt).toLocaleString('zh-CN', {
    hour12: false,
  })
  const title = candidateName?.trim()
    ? `候选人：${candidateName.trim()}`
    : '候选人智能评估报告'

  const lines: string[] = []
  lines.push(`# ${title}`)
  lines.push('')
  lines.push(
    `> AI Talent Copilot 初筛报告 ｜ ${PROVIDERS[assessment.provider].label} · ${assessment.model} ｜ 生成时间：${time}`,
  )
  if (assessment.provider === 'demo') {
    lines.push('>')
    lines.push(
      '> ⚠️ 本报告由**免费体验模式（本地模拟引擎）**生成，仅供产品体验，不代表真实 AI 评估结论。',
    )
  }
  lines.push('')
  lines.push('## 一、综合匹配度')
  lines.push('')
  if (assessment.categoryLabel) {
    lines.push(`- **岗位类别：** ${assessment.categoryLabel}`)
  }
  lines.push(`- **综合评分：${assessment.score} / 100（${assessment.band}）**`)
  lines.push(`- **核心结论：** ${assessment.summary}`)
  lines.push('')
  lines.push('## 二、胜任力维度评估')
  lines.push('')
  lines.push('| 评估维度 | 得分 | 简历证据 |')
  lines.push('| --- | --- | --- |')
  for (const s of assessment.dimensionScores) {
    const evidence = (s.evidence ?? '—').replace(/\|/g, '\\|').replace(/\n/g, ' ')
    lines.push(`| ${s.label} | ${s.score} / 100 | ${evidence} |`)
  }
  lines.push('')
  lines.push('## 三、核心优势（Highlights）')
  lines.push('')
  assessment.highlights.forEach((h, i) => lines.push(`${i + 1}. ${h}`))
  lines.push('')
  lines.push('## 四、潜在风险与待核实疑点（Risks）')
  lines.push('')
  assessment.risks.forEach((r) => {
    const tag = r.severity === 'critical' ? '🔴 重点核实' : '🟡 建议关注'
    lines.push(`- **${tag}：** ${r.text}`)
  })
  lines.push('')
  lines.push('## 五、STAR 行为面试提问库')
  lines.push('')
  assessment.questions.forEach((q, i) => {
    lines.push(`### Q${i + 1}｜考察维度：${q.dimension}`)
    lines.push('')
    lines.push(`- **提问：** ${q.question}`)
    lines.push(`- **追问建议：** ${q.followUp}`)
    lines.push('')
  })
  lines.push('---')
  lines.push('')
  lines.push('### 附：评估所勾选维度')
  lines.push('')
  lines.push(dimensions.map((d) => d.label).join('、'))
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
