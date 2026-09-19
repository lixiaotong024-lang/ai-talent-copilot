import type {
  ApiSettings,
  JobCategory,
  ProviderConfig,
  ProviderId,
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
 * 岗位类别 × 胜任力模型（基于组织心理学 KSAO / 学习敏锐度等理论，
 * 并按不同职类的典型工作产出定制维度）
 */
export const JOB_CATEGORIES: JobCategory[] = [
  {
    id: 'tech',
    label: '技术研发',
    description: '算法、开发、测试、运维、数据等技术岗位',
    dimensions: [
      {
        id: 'tech_skill',
        label: '专业技术匹配度',
        description: '硬技能、技术栈与核心项目经验同 JD 的重合度',
        family: 'skill',
      },
      {
        id: 'tech_learning',
        label: '学习能力与成长潜能',
        description: '学习敏锐度、知识迁移速度与成长天花板',
        family: 'learning',
      },
      {
        id: 'tech_teamwork',
        label: '团队协作与沟通',
        description: '跨职能协作、表达清晰度与横向影响力',
        family: 'collab',
      },
      {
        id: 'tech_resilience',
        label: '抗压与职业适应力',
        description: '高压情境韧性、不确定性应对与职业稳定性',
        family: 'resilience',
      },
    ],
  },
  {
    id: 'product',
    label: '产品',
    description: '产品经理、产品策划、用户研究等岗位',
    dimensions: [
      {
        id: 'pm_skill',
        label: '产品专业能力',
        description: '需求分析、PRD、产品规划与方案落地能力',
        family: 'skill',
      },
      {
        id: 'pm_user',
        label: '用户洞察与商业理解',
        description: '用户场景理解、商业模式与收益成本判断',
        family: 'userBusiness',
      },
      {
        id: 'pm_logic',
        label: '逻辑思维与问题拆解',
        description: '复杂问题结构化、优先级判断与方法论沉淀',
        family: 'logic',
      },
      {
        id: 'pm_influence',
        label: '跨部门协作与推动力',
        description: '无授权领导力、资源协调与项目推进能力',
        family: 'collab',
      },
    ],
  },
  {
    id: 'operation',
    label: '运营',
    description: '用户/内容/活动/电商/新媒体运营等岗位',
    dimensions: [
      {
        id: 'ops_skill',
        label: '运营专业能力',
        description: '拉新、促活、留存、转化等运营手段的完整度',
        family: 'skill',
      },
      {
        id: 'ops_data',
        label: '数据驱动与结果导向',
        description: '指标拆解、数据分析与 ROI 意识、拿结果能力',
        family: 'dataResult',
      },
      {
        id: 'ops_content',
        label: '创意策划与内容敏感度',
        description: '活动策划、文案内容与用户情绪/热点敏感度',
        family: 'content',
      },
      {
        id: 'ops_execution',
        label: '执行力与抗压韧性',
        description: '多项目并行执行、节奏快变与高压目标下的韧性',
        family: 'resilience',
      },
    ],
  },
  {
    id: 'hr',
    label: '人力资源',
    description: '招聘、培训、绩效、薪酬、HRBP、OD 等岗位',
    dimensions: [
      {
        id: 'hr_skill',
        label: 'HR 专业能力',
        description: '招聘/培训/绩效/薪酬/OD 等模块的专业深度',
        family: 'skill',
      },
      {
        id: 'hr_empathy',
        label: '共情力与人际敏感度',
        description: '倾听理解、情绪识别与差异化沟通能力',
        family: 'empathy',
      },
      {
        id: 'hr_principle',
        label: '组织原则性与保密意识',
        description: '制度执行、合规底线与敏感信息处理的可靠性',
        family: 'principle',
      },
      {
        id: 'hr_coordination',
        label: '沟通协调与服务意识',
        description: '业务伙伴意识、多方协调与冲突斡旋能力',
        family: 'collab',
      },
    ],
  },
  {
    id: 'market',
    label: '市场/销售',
    description: '市场营销、品牌、销售、商务拓展等岗位',
    dimensions: [
      {
        id: 'mkt_skill',
        label: '市场/销售专业能力',
        description: '营销策划/渠道/客户开拓等专业方法与经验',
        family: 'skill',
      },
      {
        id: 'mkt_business',
        label: '商业敏感度与目标感',
        description: '商机判断、收益意识与强目标导向',
        family: 'userBusiness',
      },
      {
        id: 'mkt_persuasion',
        label: '客户沟通与说服力',
        description: '需求挖掘、方案呈现、谈判与异议处理能力',
        family: 'collab',
      },
      {
        id: 'mkt_drive',
        label: '自驱力与抗压韧性',
        description: '拒绝承受力、业绩压力下的自我激励与恢复力',
        family: 'resilience',
      },
    ],
  },
  {
    id: 'design',
    label: '设计',
    description: 'UI/UX、视觉、交互、工业设计等岗位',
    dimensions: [
      {
        id: 'dsg_skill',
        label: '设计专业能力',
        description: '设计基本功、工具熟练度与作品集完成度',
        family: 'skill',
      },
      {
        id: 'dsg_ux',
        label: '用户体验思维',
        description: '以用户为中心的流程设计与可用性判断',
        family: 'ux',
      },
      {
        id: 'dsg_aesthetics',
        label: '审美与创意表达',
        description: '视觉品味、风格探索与创意产出能力',
        family: 'aesthetics',
      },
      {
        id: 'dsg_team',
        label: '协作沟通与抗压改稿',
        description: '设计评审沟通、需求方协作与高频修改下的韧性',
        family: 'collab',
      },
    ],
  },
  {
    id: 'general',
    label: '通用职能',
    description: '行政、财务、法务、项目管理及其他职能岗位',
    dimensions: [
      {
        id: 'gen_skill',
        label: '专业能力与经验匹配',
        description: '岗位所需专业知识、工具与过往经验的重合度',
        family: 'skill',
      },
      {
        id: 'gen_learning',
        label: '学习能力与成长潜能',
        description: '学习敏锐度、适应性与发展上限',
        family: 'learning',
      },
      {
        id: 'gen_teamwork',
        label: '团队协作与沟通',
        description: '跨部门配合、表达清晰度与服务意识',
        family: 'collab',
      },
      {
        id: 'gen_execution',
        label: '责任心与抗压执行力',
        description: '交付可靠性、细致度与多任务高压下的稳定性',
        family: 'resilience',
      },
    ],
  },
]

export const DEFAULT_CATEGORY_ID = 'tech'

export function getCategory(id: string): JobCategory {
  return JOB_CATEGORIES.find((c) => c.id === id) ?? JOB_CATEGORIES[0]
}
