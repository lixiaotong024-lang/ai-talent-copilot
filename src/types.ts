export type ProviderId = 'demo' | 'deepseek' | 'openai' | 'kimi'

export interface ProviderConfig {
  id: ProviderId
  label: string
  /** Chat Completions 接口地址 */
  endpoint: string
  defaultModel: string
  /** API Key 申请/管理地址 */
  keyUrl: string
  docsUrl: string
  /** Key 输入框提示文案 */
  keyHint: string
}

/** 单个服务商的凭证（全部保存在浏览器本地） */
export interface ProviderCreds {
  apiKey: string
  /** 留空则使用服务商默认模型 */
  model: string
  /** 留空则使用官方接口地址，可填中转/代理地址 */
  baseUrl: string
}

export interface ApiSettings {
  provider: ProviderId
  configs: Record<ProviderId, ProviderCreds>
}

/* ============================================================
 * Competency Engine 数据模型
 * 流程：JD 解析 → 证据抽取（Evidence Extraction）
 *      → 胜任力映射（Competency Mapping）→ 置信度加权评分
 *      → Gap 分析 → BEI/STAR 行为面试题
 * ============================================================ */

/** 四大一级胜任力域 */
export type DomainId =
  | 'hardSkill' // Hard Skill 专业能力 40%
  | 'cognitive' // Cognitive Ability 认知能力 25%
  | 'behavioral' // Behavioral Competency 行为胜任力 25%
  | 'roleFit' // Role Fit 岗位匹配 10%

export interface DomainScore {
  id: DomainId
  label: string
  enLabel: string
  /** 固定权重：40 / 25 / 25 / 10 */
  weight: number
  /** 0-100 */
  score: number
  /** 0-1，证据充分度与可信度 */
  confidence: number
  /** 评分依据（必须引用行为证据，不得只写结论） */
  rationale: string
}

/** 六维能力雷达轴 */
export type RadarId =
  | 'depth' // Technical/Professional Depth 专业深度
  | 'breadth' // Technical/Professional Breadth 专业广度
  | 'learning' // Learning Agility 学习敏捷
  | 'problemSolving' // Problem Solving 问题解决
  | 'execution' // Execution 执行交付
  | 'collaboration' // Collaboration & Influence 协作影响

export interface RadarAxis {
  id: RadarId
  label: string
  enLabel: string
  /** 0-100 */
  score: number
}

/** 从简历中抽取的单条行为证据 */
export interface CompetencyEvidence {
  id: string
  /** 简历原文片段（行为证据） */
  rawText: string
  /** 映射到的胜任力名称 */
  competency: string
  /** 所属一级胜任力域 */
  domain: DomainId
  /** 关联的雷达轴（Role Fit 证据可缺省） */
  axis?: RadarId
  /** 0-5，行为证据强度（STAR 完整度 / 量化程度 / 角色主导性） */
  strength: number
  /** 0-1，该证据的可信度 */
  confidence: number
}

/** 简历亮点：证据 + 为什么重要 */
export interface Highlight {
  evidence: string
  whyItMatters: string
}

export type RiskSeverity = 'warning' | 'critical'

export interface RiskItem {
  text: string
  severity: RiskSeverity
}

/** 岗位要求 vs 候选人能力的差距分析 */
export interface GapAnalysis {
  strengths: string[]
  gaps: string[]
  recommendation: string
}

/** BEI（行为事件访谈）问题：由胜任力证据缺口/风险触发 */
export interface StarQuestion {
  /** 考察的胜任力 */
  competency: string
  domain: DomainId
  /** 出题原因：证据不足 / 高分验真 / 风险核实 */
  reason: string
  question: string
  followUp: string
}

export interface JobCategory {
  id: string
  label: string
  description: string
}

export interface Assessment {
  /** 加权综合分 0-100 */
  score: number
  band: string
  /** 一句话核心结论 */
  summary: string
  /** 评估时选择的岗位类别名称 */
  categoryLabel?: string
  /** 四大胜任力域得分（含权重与置信度） */
  domainScores: DomainScore[]
  /** 六维能力雷达 */
  radar: RadarAxis[]
  /** 行为证据链 */
  evidence: CompetencyEvidence[]
  highlights: Highlight[]
  risks: RiskItem[]
  gapAnalysis: GapAnalysis
  questions: StarQuestion[]
  generatedAt: string
  model: string
  provider: ProviderId
}
