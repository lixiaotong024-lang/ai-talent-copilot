import type {
  ApiSettings,
  Assessment,
  CompetencyDimension,
  CompetencyScore,
  ProviderId,
  RiskItem,
  StarQuestion,
} from '../types'
import { PROVIDERS } from './constants'
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
  dimensions: CompetencyDimension[]
  /** 岗位类别名称，如 产品 / 运营 / 人力资源 */
  categoryLabel: string
  signal?: AbortSignal
}

const SYSTEM_PROMPT = `你是一名服务于各行各业的资深招聘专家（覆盖技术研发、产品、运营、人力资源、市场销售、设计及各类职能岗位），同时精通工业与组织心理学（I-O Psychology）的胜任力建模（Competency Modeling，含 KSAO 模型、学习敏锐度 Learning Agility、大五人格与韧性理论）以及行为事件访谈中的 STAR 法则（Situation / Task / Action / Result）。

你的任务：依据用户提供的岗位类别、岗位 JD、候选人简历以及 HR 勾选的评估维度，产出一份结构化、客观、证据导向的初筛评估报告。评估视角与用语必须贴合该岗位类别的真实工作场景（例如评估运营看拉新/留存/转化与数据结果，评估 HR 看专业模块深度/共情/原则性，评估产品看需求洞察/逻辑/推动力，而不是用技术岗的标准套所有岗位）。

硬性要求：
1. 只能输出一个 JSON 对象，不要输出 JSON 以外的任何文字、解释或 Markdown 代码块标记。
2. 评分必须基于简历中的事实证据，不得编造候选人没有写的经历；证据不足时应在风险点中明确指出。
3. 综合评分 score 为 0-100 的整数，并给出 band（推荐：90-100 强烈推荐 / 75-89 推荐面试 / 60-74 可进一步沟通 / 0-59 暂不匹配）。
4. highlights 恰好 3 条；risks 恰好 2 条；questions 为 3-4 个。
5. dimensionScores 必须覆盖用户勾选的全部维度，每项 score 为 0-100 整数，evidence 引用简历中的具体事实。
6. 面试问题必须遵循 STAR 法则，结合简历中的具体项目或简历中信息缺失的疑点，避免泛泛而谈；followUp 给出可逐层深挖的追问建议。
7. summary 为一句话中文核心结论（30-60 字），直接给出匹配判断与最核心理由。
8. 全部字段使用简体中文。

JSON Schema 如下：
{
  "score": number,
  "band": string,
  "summary": string,
  "dimensionScores": [
    { "id": string, "label": string, "score": number, "evidence": string }
  ],
  "highlights": [string, string, string],
  "risks": [
    { "text": string, "severity": "warning" | "critical" }
  ],
  "questions": [
    { "dimension": string, "question": string, "followUp": string }
  ]
}`

function buildUserPrompt(
  jd: string,
  cv: string,
  dimensions: CompetencyDimension[],
  categoryLabel: string,
) {
  const dimLines = dimensions
    .map((d) => `- ${d.label}（${d.description}）`)
    .join('\n')
  return `请评估以下候选人。

【岗位类别】${categoryLabel}

【本次重点考察维度（dimensionScores 必须逐项覆盖，id 使用括号内标识）】
${dimensions.map((d) => `- ${d.label}（id: ${d.id}）`).join('\n')}

维度释义：
${dimLines}

【岗位 JD 开始】
${jd}
【岗位 JD 结束】

【候选人简历开始】
${cv}
【候选人简历结束】

请严格按照系统消息中的 JSON Schema 输出评估结果。`
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

function pickJson(raw: string): unknown {
  let text = raw.trim()
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) text = fence[1].trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end > start) text = text.slice(start, end + 1)
  return JSON.parse(text)
}

function asStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback
  return value.map((v) => String(v).trim()).filter(Boolean)
}

function normalize(
  data: Record<string, unknown>,
  dimensions: CompetencyDimension[],
  provider: ProviderId,
  model: string,
  categoryLabel: string,
): Assessment {
  const rawScores = Array.isArray(data.dimensionScores)
    ? (data.dimensionScores as Record<string, unknown>[])
    : []

  const dimensionScores: CompetencyScore[] = dimensions.map((d) => {
    const hit = rawScores.find(
      (s) => String(s.id) === d.id || String(s.label) === d.label,
    )
    return {
      id: d.id,
      label: d.label,
      score: clampScore(hit?.score),
      evidence: hit?.evidence ? String(hit.evidence) : undefined,
    }
  })

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
    .slice(0, 2)

  const questions: StarQuestion[] = (
    Array.isArray(data.questions) ? (data.questions as unknown[]) : []
  )
    .map((q) => {
      const obj = (q ?? {}) as Record<string, unknown>
      return {
        dimension: String(obj.dimension ?? '综合考察'),
        question: String(obj.question ?? '').trim(),
        followUp: String(obj.followUp ?? '').trim(),
      }
    })
    .filter((q) => q.question)
    .slice(0, 4)

  return {
    score: clampScore(data.score),
    band: String(data.band ?? '').trim() || '待评估',
    summary: String(data.summary ?? '').trim() || '模型未返回核心结论，请重试。',
    categoryLabel,
    dimensionScores,
    highlights: asStringArray(data.highlights, []).slice(0, 3),
    risks,
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
  dimensions,
  categoryLabel,
  signal,
}: GenerateArgs): Promise<Assessment> {
  const providerId = settings.provider

  // 免费体验模式：本地模拟，无需 Key、不发网络请求
  if (providerId === 'demo') {
    await delay(1100, signal)
    return runLocalSimulation(jd, cv, dimensions, categoryLabel)
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
          { role: 'user', content: buildUserPrompt(jd, cv, dimensions, categoryLabel) },
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
    return normalize(parsed, dimensions, providerId, model, categoryLabel)
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
