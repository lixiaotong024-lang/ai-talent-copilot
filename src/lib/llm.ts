import type {
  ApiSettings,
  Assessment,
  CompetencyEvidence,
  DomainId,
  DomainScore,
  GapAnalysis,
  Highlight,
  ProviderId,
  RadarAxis,
  RiskItem,
  StarQuestion,
} from '../types'
import { PROVIDERS, RADAR_AXES } from './constants'
import { runLocalSimulation } from './localSimulation'

export class LlmError extends Error {
  kind: 'auth' | 'network' | 'rate' | 'badresponse' | 'other'
  constructor(
    message: string,
    kind: 'auth' | 'network' | 'rate' | 'badresponse' | 'other' = 'other',
  ) {
    super(message)
    this.name = 'LlmError'
    this.kind = kind
  }
}

interface GenerateArgs {
  settings: ApiSettings
  jd: string
  cv: string
  /** 岗位类别名称，如 产品 / 运营 / 人力资源 */
  categoryLabel: string
  signal?: AbortSignal
}

const SYSTEM_PROMPT = `你是 AI Talent Copilot 的「胜任力评估引擎」，一名基于工业与组织心理学（I-O Psychology）胜任力模型（Competency Modeling）的资深招聘官 + Hiring Manager。你服务于各行各业（技术研发、产品、运营、人力资源、市场销售、设计及各类职能岗位），评估视角必须贴合所给岗位类别的真实工作场景。

# 你的任务
不是比较 JD 与简历的关键词匹配率，而是模拟优秀招聘官的分析过程：通过候选人的经历描述，识别其背后的行为证据（Competency Evidence），推导胜任力水平，产出可解释（Explainable）、证据导向（Evidence-Based）、行为导向（Behavior-Oriented）、聚焦胜任力（Competency-Focused）的评估。

# 评估流水线（必须严格按此顺序思考）
1. 解析 JD：提取岗位名称、职责、技能要求、加分项、团队环境、业务场景。
2. 自动构建岗位胜任力画像（Hard Skill / Cognitive Ability / Behavioral Competency / Role Fit）。
3. Evidence Extraction：从简历逐条抽取行为证据（原文片段），映射到具体胜任力，给出 0-5 的证据强度与 0-1 置信度。一个行为可以同时映射多项胜任力（如"2周完成 Agent 调研并上线 POC"同时证明 Learning Agility 与 Execution）。
4. Competency Mapping + Scoring：分数 = 证据强度 × 证据置信度 × JD 权重，聚合到四大域与六维雷达。
5. Gap Analysis：对比岗位要求与候选人能力，输出优势、差距与面试建议。
6. 根据胜任力缺口/高分项/风险点生成 BEI（行为事件访谈）问题，严格遵循 STAR（Situation/Task/Action/Result）结构。

# 绝对禁止
- 仅凭关键词数量打分；
- 仅凭学校、公司背景、工作年限打分（这些只能作为 Role Fit 的参考，不得主导分数）；
- 编造简历中不存在的经历；任何评分必须能在 evidence 中找到行为证据，证据不足要在 risks/gaps 中明确指出，并降低 confidence。

# 四大胜任力域（权重固定，综合分 = 加权求和）
- Hard Skill 专业能力 40%：岗位专业知识、工具方法与落地能力
- Cognitive Ability 认知能力 25%：学习敏捷、Problem Solving、系统/抽象思维、知识迁移（GMA 是最强绩效预测因子之一）
- Behavioral Competency 行为胜任力 25%：Ownership、Execution、Collaboration & Influence、Innovation
- Role Fit 岗位匹配 10%：行业相关、创业/大厂/模糊环境适配、职业稳定性、文化匹配

# 六维雷达（id 固定）
depth 专业深度 / breadth 专业广度 / learning 学习敏捷 / problemSolving 问题解决 / execution 执行交付 / collaboration 协作影响

# 数量与格式要求
1. 只能输出一个 JSON 对象，不要输出 JSON 以外的任何文字或 Markdown 代码块标记。
2. evidence 5-10 条，raw_text 必须是简历原文片段（可适当截断），优先选取含主导角色与量化结果的行为。
3. highlights 恰好 3 条；risks 2-3 条；interview_questions 恰好 4 个（2 个针对最弱胜任力取证、1 个针对最强项验真防注水、1 个核实职业动机与环境适配）。
4. 各域 score、雷达 score 均为 0-100 整数；confidence 为 0-1 两位小数；strength 为 0-5（可一位小数）。
5. overall_score 必须等于四域加权分（40/25/25/10）四舍五入；band：90-100 强烈推荐 / 75-89 推荐面试 / 60-74 可进一步沟通 / 0-59 暂不匹配。
6. 全部内容使用简体中文。

# JSON Schema
{
  "overall_score": number,
  "band": string,
  "summary": string,
  "hard_skill":           { "score": number, "confidence": number, "rationale": string },
  "cognitive_ability":    { "score": number, "confidence": number, "rationale": string },
  "behavioral_competency":{ "score": number, "confidence": number, "rationale": string },
  "role_fit":             { "score": number, "confidence": number, "rationale": string },
  "radar": [
    { "id": "depth"|"breadth"|"learning"|"problemSolving"|"execution"|"collaboration", "score": number }
  ],
  "evidence": [
    { "raw_text": string, "competency": string, "domain": "hardSkill"|"cognitive"|"behavioral"|"roleFit", "strength": number, "confidence": number }
  ],
  "highlights": [
    { "evidence": string, "why_it_matters": string }
  ],
  "risks": [
    { "text": string, "severity": "warning"|"critical" }
  ],
  "gap_analysis": {
    "strengths": [string],
    "gaps": [string],
    "recommendation": string
  },
  "interview_questions": [
    { "competency": string, "domain": string, "reason": string, "question": string, "follow_up": string }
  ]
}`

function buildUserPrompt(jd: string, cv: string, categoryLabel: string) {
  return `请评估以下候选人。

【岗位类别】${categoryLabel}
（请结合该职类的典型工作场景理解 JD 并构建胜任力画像，但四大域权重与六维雷达固定不变。）

【岗位 JD 开始】
${jd}
【岗位 JD 结束】

【候选人简历开始】
${cv}
【候选人简历结束】

请先在内部完成「JD 解析 → 证据抽取 → 胜任力映射 → 加权评分 → Gap 分析 → BEI 出题」全流程，然后严格按照系统消息中的 JSON Schema 输出最终结果，不要输出思考过程。`
}

function resolveEndpoint(provider: ProviderId, baseUrl: string): string {
  const fallback = PROVIDERS[provider].endpoint
  const trimmed = baseUrl.trim()
  if (!trimmed) return fallback
  if (/\/chat\/completions\/?$/.test(trimmed)) return trimmed
  return `${trimmed.replace(/\/+$/, '')}/chat/completions`
}

function clampScore(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, Math.round(n)))
}

function clampConf(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0.6
  return Math.max(0.4, Math.min(0.95, Math.round(n * 100) / 100))
}

function pickJson(raw: string): unknown {
  let text = raw.trim()
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) text = fence[1].trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end > start) text = text.slice(start, end + 1)
  return JSON.parse(text)
}

const DOMAIN_META: Record<
  DomainId,
  { key: string; label: string; enLabel: string; weight: number }
> = {
  hardSkill: { key: 'hard_skill', label: '专业能力', enLabel: 'Hard Skill', weight: 40 },
  cognitive: { key: 'cognitive_ability', label: '认知能力', enLabel: 'Cognitive Ability', weight: 25 },
  behavioral: { key: 'behavioral_competency', label: '行为胜任力', enLabel: 'Behavioral Competency', weight: 25 },
  roleFit: { key: 'role_fit', label: '岗位匹配', enLabel: 'Role Fit', weight: 10 },
}
const DOMAIN_IDS = Object.keys(DOMAIN_META) as DomainId[]
const VALID_DOMAINS: DomainId[] = ['hardSkill', 'cognitive', 'behavioral', 'roleFit']

function asDomain(value: unknown): DomainId {
  const s = String(value)
  return (VALID_DOMAINS as string[]).includes(s) ? (s as DomainId) : 'behavioral'
}

function normalize(
  data: Record<string, unknown>,
  provider: ProviderId,
  model: string,
  categoryLabel: string,
): Assessment {
  /* ---- 四大域 ---- */
  const domainScores: DomainScore[] = DOMAIN_IDS.map((id) => {
    const meta = DOMAIN_META[id]
    const raw = (data[meta.key] ?? {}) as Record<string, unknown>
    return {
      id,
      label: meta.label,
      enLabel: meta.enLabel,
      weight: meta.weight,
      score: clampScore(raw.score),
      confidence: clampConf(raw.confidence),
      rationale: String(raw.rationale ?? '').trim() || '模型未给出该域的评分依据。',
    }
  })

  // 综合分：优先使用模型分，缺失时由四域加权重算
  const weighted = Math.round(
    domainScores.reduce((acc, d) => acc + d.score * (d.weight / 100), 0),
  )
  const overall = data.overall_score == null ? weighted : clampScore(data.overall_score)

  /* ---- 六维雷达（容错：缺项按顺序补默认值） ---- */
  const rawRadar = Array.isArray(data.radar)
    ? (data.radar as Record<string, unknown>[])
    : []
  const radar: RadarAxis[] = RADAR_AXES.map((axis) => {
    const hit = rawRadar.find((r) => String(r.id) === axis.id)
    return { ...axis, score: hit ? clampScore(hit.score) : 60 }
  })

  /* ---- 证据链 ---- */
  const evidence: CompetencyEvidence[] = (
    Array.isArray(data.evidence) ? (data.evidence as Record<string, unknown>[]) : []
  )
    .map((e, i) => ({
      id: `EV-${String(i + 1).padStart(2, '0')}`,
      rawText: String(e.raw_text ?? '').trim(),
      competency: String(e.competency ?? '综合胜任力').trim(),
      domain: asDomain(e.domain),
      strength: Math.max(1, Math.min(5, Number(e.strength) || 3)),
      confidence: clampConf(e.confidence),
    }))
    .filter((e) => e.rawText)
    .slice(0, 10)

  /* ---- 亮点 ---- */
  const rawHighlights = Array.isArray(data.highlights)
    ? (data.highlights as unknown[])
    : []
  const highlights: Highlight[] = rawHighlights
    .map((h) =>
      typeof h === 'string'
        ? { evidence: h, whyItMatters: '' }
        : {
            evidence: String((h as Record<string, unknown>)?.evidence ?? '').trim(),
            whyItMatters: String(
              (h as Record<string, unknown>)?.why_it_matters ?? '',
            ).trim(),
          },
    )
    .filter((h) => h.evidence)
    .slice(0, 3)
  while (highlights.length < 3) {
    highlights.push({ evidence: '模型未提供足够亮点，请重试。', whyItMatters: '' })
  }

  /* ---- 风险 ---- */
  const risks: RiskItem[] = (
    Array.isArray(data.risks) ? (data.risks as unknown[]) : []
  )
    .map((r) =>
      typeof r === 'string'
        ? { text: r, severity: 'warning' as const }
        : {
            text: String((r as Record<string, unknown>)?.text ?? '').trim(),
            severity:
              (r as Record<string, unknown>)?.severity === 'critical'
                ? ('critical' as const)
                : ('warning' as const),
          },
    )
    .filter((r) => r.text)
    .slice(0, 3)

  /* ---- Gap 分析 ---- */
  const rawGap = (data.gap_analysis ?? {}) as Record<string, unknown>
  const strArr = (v: unknown): string[] =>
    Array.isArray(v)
      ? v.map((x) => String(x).trim()).filter(Boolean).slice(0, 3)
      : []
  const gapAnalysis: GapAnalysis = {
    strengths: strArr(rawGap.strengths),
    gaps: strArr(rawGap.gaps),
    recommendation: String(rawGap.recommendation ?? '').trim() || '模型未给出面试建议。',
  }

  /* ---- BEI 问题 ---- */
  const questions: StarQuestion[] = (
    Array.isArray(data.interview_questions)
      ? (data.interview_questions as Record<string, unknown>[])
      : []
  )
    .map((q) => ({
      competency: String(q.competency ?? '综合胜任力').trim(),
      domain: asDomain(q.domain),
      reason: String(q.reason ?? '').trim(),
      question: String(q.question ?? '').trim(),
      followUp: String(q.follow_up ?? '').trim(),
    }))
    .filter((q) => q.question)
    .slice(0, 4)

  return {
    score: overall,
    band: String(data.band ?? '').trim() || '待评估',
    summary: String(data.summary ?? '').trim() || '模型未返回核心结论，请重试。',
    categoryLabel,
    domainScores,
    radar,
    evidence,
    highlights,
    risks,
    gapAnalysis,
    questions,
    generatedAt: new Date().toISOString(),
    model,
    provider,
  }
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      window.clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

export async function generateAssessment({
  settings,
  jd,
  cv,
  categoryLabel,
  signal,
}: GenerateArgs): Promise<Assessment> {
  const providerId = settings.provider

  // 免费体验模式：本地胜任力引擎，无需 Key、不发网络请求
  if (providerId === 'demo') {
    await delay(1300, signal)
    return runLocalSimulation(jd, cv, categoryLabel)
  }

  const creds = settings.configs[providerId]
  const meta = PROVIDERS[providerId]
  const apiKey = creds.apiKey.trim()
  if (!apiKey) {
    throw new LlmError(
      `尚未配置 ${meta.label} 的 API Key，请点击右上角「API 设置」完成配置。`,
      'auth',
    )
  }
  const model = creds.model.trim() || meta.defaultModel
  const endpoint = resolveEndpoint(providerId, creds.baseUrl)

  let res: Response
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(jd, cv, categoryLabel) },
        ],
      }),
      signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new LlmError(
      '网络请求失败：可能是接口地址不可达，或该服务商不允许浏览器跨域（CORS）直连，可尝试在设置中配置可用的中转 Base URL。',
      'network',
    )
  }

  if (!res.ok) {
    let detail = ''
    try {
      const errBody = (await res.json()) as {
        error?: { message?: string; type?: string }
      }
      detail = errBody?.error?.message ?? ''
    } catch {
      /* 忽略非 JSON 错误体 */
    }
    if (res.status === 401 || res.status === 403) {
      throw new LlmError(
        `API Key 无效或权限不足（HTTP ${res.status}）。${detail}`,
        'auth',
      )
    }
    if (res.status === 429) {
      throw new LlmError(
        `请求过于频繁或账户额度不足（HTTP 429）。${detail}`,
        'rate',
      )
    }
    throw new LlmError(`接口返回错误（HTTP ${res.status}）。${detail}`)
  }

  const payload = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = payload.choices?.[0]?.message?.content
  if (!content) {
    throw new LlmError('模型返回为空，请检查模型名称或稍后重试。', 'badresponse')
  }

  try {
    const parsed = pickJson(content) as Record<string, unknown>
    return normalize(parsed, providerId, model, categoryLabel)
  } catch {
    throw new LlmError(
      '模型输出无法解析为结构化数据，请重新生成（可适当精简简历内容后重试）。',
      'badresponse',
    )
  }
}

export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
}
