import type {
  ApiSettings,
  DomainId,
  JobCategory,
  ProviderConfig,
  ProviderId,
  RadarId,
} from '../types'

export const GITHUB_URL = 'https://github.com/lixiaotong024-lang'

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  demo: {
    id: 'demo',
    label: '免费体验模式',
    endpoint: '',
    defaultModel: 'local-simulation-v1',
    keyUrl: '',
    docsUrl: '',
    keyHint: '本地模拟无需 API Key，不发送任何网络请求',
  },
  deepseek: {
    id: 'deepseek',
    label: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    defaultModel: 'deepseek-chat',
    keyUrl: 'https://platform.deepseek.com/api_keys',
    docsUrl: 'https://api-docs.deepseek.com/',
    keyHint: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  },
  openai: {
    id: 'openai',
    label: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o-mini',
    keyUrl: 'https://platform.openai.com/api-keys',
    docsUrl: 'https://platform.openai.com/docs',
    keyHint: 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx',
  },
  kimi: {
    id: 'kimi',
    label: 'Kimi · Moonshot',
    endpoint: 'https://api.moonshot.cn/v1/chat/completions',
    defaultModel: 'moonshot-v1-8k',
    keyUrl: 'https://platform.moonshot.cn/console/api-keys',
    docsUrl: 'https://platform.moonshot.cn/docs',
    keyHint: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  },
}

export const PROVIDER_ORDER: ProviderId[] = ['demo', 'deepseek', 'openai', 'kimi']

const emptyCreds = () => ({ apiKey: '', model: '', baseUrl: '' })

export const DEFAULT_SETTINGS: ApiSettings = {
  provider: 'demo',
  configs: {
    demo: emptyCreds(),
    deepseek: emptyCreds(),
    openai: emptyCreds(),
    kimi: emptyCreds(),
  },
}

/**
 * 岗位类别：作为「胜任力画像」的上下文提示，
 * 引擎会结合 JD 内容自动构建该岗位的目标 Competency Model，
 * 因此用户无需手动勾选维度。
 */
export const JOB_CATEGORIES: JobCategory[] = [
  { id: 'tech', label: '技术研发', description: '算法、开发、测试、运维、数据等技术岗位' },
  { id: 'product', label: '产品', description: '产品经理、产品策划、用户研究等岗位' },
  { id: 'operation', label: '运营', description: '用户/内容/活动/电商/新媒体运营等岗位' },
  { id: 'hr', label: '人力资源', description: '招聘、培训、绩效、薪酬、HRBP、OD 等岗位' },
  { id: 'market', label: '市场/销售', description: '市场营销、品牌、销售、商务拓展等岗位' },
  { id: 'design', label: '设计', description: 'UI/UX、视觉、交互、工业设计等岗位' },
  { id: 'general', label: '通用职能', description: '行政、财务、法务、项目管理及其他职能岗位' },
]

export const DEFAULT_CATEGORY_ID = 'tech'

export function getCategory(id: string): JobCategory {
  return JOB_CATEGORIES.find((c) => c.id === id) ?? JOB_CATEGORIES[0]
}

/** 四大一级胜任力域（权重固定，综合分 = Σ 域得分 × 权重） */
export const COMPETENCY_DOMAINS: {
  id: DomainId
  label: string
  enLabel: string
  weight: number
  description: string
}[] = [
  {
    id: 'hardSkill',
    label: '专业能力',
    enLabel: 'Hard Skill',
    weight: 40,
    description: '岗位所需专业知识、工具方法与工程/业务落地能力',
  },
  {
    id: 'cognitive',
    label: '认知能力',
    enLabel: 'Cognitive Ability',
    weight: 25,
    description: '学习敏捷、问题解决、系统与抽象思维、知识迁移（GMA）',
  },
  {
    id: 'behavioral',
    label: '行为胜任力',
    enLabel: 'Behavioral Competency',
    weight: 25,
    description: 'Ownership、执行交付、协作沟通与影响力、创新变革',
  },
  {
    id: 'roleFit',
    label: '岗位匹配',
    enLabel: 'Role Fit',
    weight: 10,
    description: '行业相关、环境适配（创业/大厂/模糊情境）与职业稳定性',
  },
]

/** 六维能力雷达（跨岗位通用） */
export const RADAR_AXES: {
  id: RadarId
  label: string
  enLabel: string
}[] = [
  { id: 'depth', label: '专业深度', enLabel: 'Depth' },
  { id: 'breadth', label: '专业广度', enLabel: 'Breadth' },
  { id: 'learning', label: '学习敏捷', enLabel: 'Learning Agility' },
  { id: 'problemSolving', label: '问题解决', enLabel: 'Problem Solving' },
  { id: 'execution', label: '执行交付', enLabel: 'Execution' },
  { id: 'collaboration', label: '协作影响', enLabel: 'Collaboration' },
]
