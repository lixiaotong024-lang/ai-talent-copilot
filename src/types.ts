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

/** 维度归属的信号族，驱动本地模拟引擎的评分与 STAR 题库 */
export type DimensionFamily =
  | 'skill'
  | 'learning'
  | 'collab'
  | 'resilience'
  | 'userBusiness'
  | 'dataResult'
  | 'logic'
  | 'content'
  | 'empathy'
  | 'principle'
  | 'ux'
  | 'aesthetics'

export interface CompetencyDimension {
  id: string
  label: string
  description: string
  family: DimensionFamily
}

export interface JobCategory {
  id: string
  label: string
  description: string
  dimensions: CompetencyDimension[]
}

export type RiskSeverity = 'warning' | 'critical'

export interface CompetencyScore {
  id: string
  label: string
  score: number
  evidence?: string
}

export interface StarQuestion {
  dimension: string
  question: string
  followUp: string
}

export interface RiskItem {
  text: string
  severity: RiskSeverity
}

export interface Assessment {
  /** 0-100 */
  score: number
  band: string
  /** 一句话核心结论 */
  summary: string
  /** 评估时选择的岗位类别名称 */
  categoryLabel?: string
  dimensionScores: CompetencyScore[]
  highlights: string[]
  risks: RiskItem[]
  questions: StarQuestion[]
  generatedAt: string
  model: string
  provider: ProviderId
}
