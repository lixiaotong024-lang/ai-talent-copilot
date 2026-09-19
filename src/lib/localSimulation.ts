import type {
  Assessment,
  CompetencyDimension,
  CompetencyScore,
  DimensionFamily,
  RiskItem,
  StarQuestion,
} from '../types'

/**
 * 免费体验模式：完全在浏览器本地运行的启发式评估模拟器。
 * 不调用任何大模型接口，依据 JD↔简历的技能词覆盖度与经历信号生成仿真报告，
 * 覆盖技术、产品、运营、HR、市场、设计、通用职能等各类岗位。
 */

interface SkillSignal {
  aliases: string[]
  label: string
}

// 跨岗位通用技能词库（中英文别名，命中任一即可）
const SKILL_LEXICON: SkillSignal[] = [
  // —— 技术研发 ——
  { aliases: ['python'], label: 'Python' },
  { aliases: ['c++'], label: 'C++' },
  { aliases: ['java'], label: 'Java' },
  { aliases: ['golang', 'go 语言'], label: 'Go' },
  { aliases: ['pytorch'], label: 'PyTorch' },
  { aliases: ['tensorflow'], label: 'TensorFlow' },
  { aliases: ['transformer'], label: 'Transformer' },
  { aliases: ['bert', 'roberta'], label: 'BERT 系预训练模型' },
  { aliases: ['gpt', 'llama', 'qwen', 'chatglm', 'deepseek'], label: '主流大模型' },
  { aliases: ['llm', '大模型', '大语言模型'], label: '大模型（LLM）' },
  { aliases: ['nlp', '自然语言处理'], label: '自然语言处理（NLP）' },
  { aliases: ['rag', '检索增强'], label: 'RAG 检索增强' },
  { aliases: ['langchain'], label: 'LangChain' },
  { aliases: ['milvus', 'faiss', '向量数据库'], label: '向量数据库' },
  { aliases: ['sft', 'fine-tun', '微调'], label: '模型微调（SFT）' },
  { aliases: ['lora', 'qlora'], label: 'LoRA 参数高效微调' },
  { aliases: ['vllm', 'tensorrt', 'onnx', '推理部署', '模型服务化'], label: '推理加速与部署' },
  { aliases: ['agent', '智能体'], label: 'Agent 智能体' },
  { aliases: ['多模态'], label: '多模态' },
  { aliases: ['意图识别'], label: '意图识别' },
  { aliases: ['命名实体', 'ner'], label: '命名实体识别（NER）' },
  { aliases: ['文本分类'], label: '文本分类' },
  { aliases: ['语义匹配'], label: '语义匹配' },
  { aliases: ['prompt', '提示词'], label: 'Prompt 工程' },
  { aliases: ['huggingface'], label: 'HuggingFace 生态' },
  { aliases: ['deepspeed'], label: 'DeepSpeed 分布式训练' },
  { aliases: ['docker'], label: 'Docker' },
  { aliases: ['kubernetes', 'k8s'], label: 'Kubernetes' },
  { aliases: ['spark', 'flink', 'kafka'], label: '大数据计算' },
  { aliases: ['前端', 'react', 'vue', 'typescript'], label: '前端开发' },
  { aliases: ['后端', '微服务', 'spring'], label: '后端开发' },
  { aliases: ['测试', '自动化测试', 'qa'], label: '测试与质量保障' },
  { aliases: ['运维', 'devops', 'ci/cd'], label: '运维与 DevOps' },
  // —— 产品 ——
  { aliases: ['需求分析', '需求评审', '需求管理'], label: '需求分析与管理' },
  { aliases: ['prd', '产品文档'], label: 'PRD 撰写' },
  { aliases: ['产品规划', '路线图', 'roadmap'], label: '产品规划' },
  { aliases: ['axure'], label: 'Axure 原型' },
  { aliases: ['figma'], label: 'Figma' },
  { aliases: ['用户调研', '用户访谈', '深度访谈'], label: '用户调研' },
  { aliases: ['竞品分析'], label: '竞品分析' },
  { aliases: ['用户画像', 'persona'], label: '用户画像' },
  { aliases: ['a/b', 'ab 测试', 'ab测试', '对照实验'], label: 'A/B 实验' },
  { aliases: ['北极星', '指标体系', '指标拆解'], label: '指标体系搭建' },
  { aliases: ['saas'], label: 'SaaS 产品经验' },
  { aliases: ['b 端', 'b端'], label: 'B 端产品' },
  { aliases: ['c 端', 'c端'], label: 'C 端产品' },
  { aliases: ['产品经理', '产品策划'], label: '产品策划' },
  // —— 运营/市场 ——
  { aliases: ['用户运营'], label: '用户运营' },
  { aliases: ['内容运营'], label: '内容运营' },
  { aliases: ['活动运营', '活动策划'], label: '活动运营' },
  { aliases: ['社群运营', '社群'], label: '社群运营' },
  { aliases: ['私域'], label: '私域运营' },
  { aliases: ['新媒体运营', '新媒体'], label: '新媒体运营' },
  { aliases: ['电商运营'], label: '电商运营' },
  { aliases: ['增长黑客', '增长运营', '用户增长'], label: '增长运营' },
  { aliases: ['拉新', '获客'], label: '拉新获客' },
  { aliases: ['促活', '留存', '召回'], label: '促活与留存' },
  { aliases: ['转化', '转化率'], label: '转化运营' },
  { aliases: ['gmv'], label: 'GMV 经营' },
  { aliases: ['dau', 'mau'], label: 'DAU/MAU 运营' },
  { aliases: ['roi'], label: 'ROI 管理' },
  { aliases: ['投放', '信息流', 'sem'], label: '付费投放' },
  { aliases: ['裂变'], label: '裂变玩法' },
  { aliases: ['sop'], label: '运营 SOP' },
  { aliases: ['rfm', 'aarrr'], label: '用户分层模型（RFM/AARRR）' },
  { aliases: ['公众号'], label: '公众号运营' },
  { aliases: ['小红书'], label: '小红书运营' },
  { aliases: ['抖音', '短视频'], label: '抖音/短视频' },
  { aliases: ['视频号'], label: '视频号运营' },
  { aliases: ['直播'], label: '直播运营' },
  { aliases: ['文案', '选题'], label: '文案撰写' },
  { aliases: ['kol', '达人'], label: 'KOL/达人合作' },
  { aliases: ['会员运营', '复购'], label: '会员与复购运营' },
  { aliases: ['scrm', '企业微信'], label: '企业微信 SCRM' },
  { aliases: ['品牌'], label: '品牌营销' },
  { aliases: ['公关', '舆情'], label: '公关传播' },
  { aliases: ['seo'], label: 'SEO' },
  { aliases: ['渠道'], label: '渠道管理' },
  { aliases: ['商务拓展', 'bd'], label: '商务拓展（BD）' },
  { aliases: ['大客户', 'ka '], label: '大客户销售' },
  { aliases: ['mql', '销售线索', '线索'], label: '销售线索运营' },
  { aliases: ['白皮书'], label: '白皮书/案例营销' },
  { aliases: ['峰会', '展会', '行业活动'], label: '线下活动营销' },
  { aliases: ['提案', '宣讲'], label: '客户提案宣讲' },
  { aliases: ['谈判'], label: '商务谈判' },
  { aliases: ['客户成功'], label: '客户成功' },
  // —— HR ——
  { aliases: ['招聘'], label: '招聘配置' },
  { aliases: ['培训'], label: '培训发展' },
  { aliases: ['绩效'], label: '绩效管理' },
  { aliases: ['薪酬'], label: '薪酬福利' },
  { aliases: ['hrbp'], label: 'HRBP' },
  { aliases: ['组织发展', 'od '], label: '组织发展（OD）' },
  { aliases: ['员工关系'], label: '员工关系' },
  { aliases: ['人才盘点'], label: '人才盘点' },
  { aliases: ['雇主品牌'], label: '雇主品牌' },
  { aliases: ['劳动法'], label: '劳动法规' },
  { aliases: ['猎头'], label: '猎头渠道管理' },
  { aliases: ['内推'], label: '内推体系' },
  { aliases: ['任职资格'], label: '任职资格体系' },
  { aliases: ['胜任力模型', '胜任力'], label: '胜任力建模' },
  { aliases: ['三支柱'], label: 'HR 三支柱' },
  { aliases: ['校招'], label: '校园招聘' },
  { aliases: ['人才测评', '测评'], label: '人才测评' },
  { aliases: ['okr'], label: 'OKR 管理' },
  { aliases: ['敬业度'], label: '员工敬业度' },
  // —— 设计 ——
  { aliases: ['ui 设计', 'ui设计'], label: 'UI 设计' },
  { aliases: ['ux', '用户体验设计'], label: 'UX 用户体验设计' },
  { aliases: ['交互设计'], label: '交互设计' },
  { aliases: ['视觉设计'], label: '视觉设计' },
  { aliases: ['平面设计'], label: '平面设计' },
  { aliases: ['设计系统', '组件库', 'design token'], label: '设计系统/组件库' },
  { aliases: ['可用性测试'], label: '可用性测试' },
  { aliases: ['信息架构'], label: '信息架构' },
  { aliases: ['作品集'], label: '作品集' },
  { aliases: ['动效', 'after effects'], label: '动效设计' },
  { aliases: ['photoshop'], label: 'Photoshop' },
  { aliases: ['illustrator'], label: 'Illustrator' },
  { aliases: ['sketch'], label: 'Sketch' },
  { aliases: ['还原度'], label: '设计还原走查' },
  // —— 通用职能/数据/协作工具 ——
  { aliases: ['项目管理', 'pmo'], label: '项目管理' },
  { aliases: ['pmp'], label: 'PMP 认证' },
  { aliases: ['sql'], label: 'SQL 数据分析' },
  { aliases: ['excel', '数据透视'], label: 'Excel 数据处理' },
  { aliases: ['tableau', 'power bi', '帆软'], label: 'BI 报表工具' },
  { aliases: ['ppt', 'powerpoint'], label: 'PPT 汇报' },
  { aliases: ['供应商管理', '供应商'], label: '供应商管理' },
  { aliases: ['合同'], label: '合同管理' },
  { aliases: ['预算管理', '预算'], label: '预算管理' },
  { aliases: ['风险'], label: '风险管理' },
  { aliases: ['erp'], label: 'ERP 系统' },
  { aliases: ['行政'], label: '行政管理' },
  { aliases: ['财务'], label: '财务专业' },
  { aliases: ['法务', '法律'], label: '法务合规' },
  { aliases: ['供应链'], label: '供应链管理' },
  { aliases: ['客户服务', '客服'], label: '客户服务' },
]

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(n)))

const has = (text: string, words: string[]) =>
  words.some((w) => text.includes(w.toLowerCase()))

const countHits = (text: string, groups: string[][]) =>
  groups.reduce((acc, words) => acc + (has(text, words) ? 1 : 0), 0)

function bandOf(score: number): string {
  if (score >= 90) return '强烈推荐'
  if (score >= 75) return '推荐面试'
  if (score >= 60) return '可进一步沟通'
  return '暂不匹配'
}

interface FamilyContext {
  coverage: number
  matchedCount: number
  requiredCount: number
  matchedLabels: string[]
  quantified: boolean
  education: number
  papers: number
  openSource: number
  certs: number
  collab: number
  resilience: number
  data: number
  userBusiness: number
  logic: number
  content: number
  empathy: number
  principle: number
  ux: number
  aesthetics: number
  learningExtra: number
}

interface FamilyResult {
  score: number
  evidence: string
}

export function runLocalSimulation(
  jd: string,
  cv: string,
  dimensions: CompetencyDimension[],
  categoryLabel = '目标岗位',
): Assessment {
  const jdText = jd.toLowerCase()
  const cvText = cv.toLowerCase()

  /* ---------- 技能覆盖度 ---------- */
  const required = SKILL_LEXICON.filter((s) =>
    s.aliases.some((a) => jdText.includes(a)),
  )
  const matched = required.filter((s) =>
    s.aliases.some((a) => cvText.includes(a)),
  )
  const coverage = required.length ? matched.length / required.length : 0.5
  const matchedLabels = matched.map((s) => s.label)
  const missingLabels = required
    .filter((s) => !matched.some((m) => m.label === s.label))
    .map((s) => s.label)

  /* ---------- 通用经历信号 ---------- */
  const education = has(cvText, ['博士', 'phd', 'ph.d'])
    ? 3
    : has(cvText, ['硕士', '研究生', 'master'])
      ? 2
      : has(cvText, ['本科', '学士', 'bachelor'])
        ? 1
        : 0

  const papers = countHits(cvText, [
    ['acl', 'emnlp', 'neurips', 'icml', 'naacl', 'cvpr', 'aaai', 'ijcai', 'kdd', 'sigir', 'chi'],
    ['论文', '发表', '一作', '二作', '长文'],
  ])
  const openSource = countHits(cvText, [
    ['github', 'gitlab', '开源', 'open source'],
    ['star', '维护者', 'committer', '贡献者'],
  ])
  const certs = countHits(cvText, [
    ['pmp', 'cfa', 'cpa', '法律职业资格', '人力资源管理师', '认证', '证书'],
    [' prince2', 'pmi', 'cfa', 'frm', 'acp'],
  ])
  const learningExtra =
    countHits(cvText, [['博客', '专栏', '知乎', '掘金', '技术分享', '讲座', '内部分享', '课程']]) +
    countHits(cvText, [['获奖', '竞赛', '金奖', '一等奖', 'acm', 'kaggle', '奖学金'], ['gpa', '排名前', '专业前']])

  const quantified =
    /\d+(\.\d+)?\s*(%|％|个百分点|倍|万|百万|亿|分|天)|f1|auc|准确率|延迟|p99|gmv|dau|roi|arr|mql|nps|留存率|转化率|增长|提升|下降/i.test(
      cv,
    )

  const collab = countHits(cvText, [
    ['协作', '合作', '配合'],
    ['跨部门', '跨职能', '横向', '对接'],
    ['产品经理', '研发', '后端', '前端', '设计', '运营', '业务方', '销售'],
    ['带领', '带队', '带过', 'mentor', '指导实习'],
    ['推动', '牵头', '主导', '协调'],
    ['沟通', '对齐', '共识'],
  ])

  const resilience = countHits(cvText, [
    ['上线', '投产', '线上'],
    ['攻关', '攻坚', '救火', '故障', '应急'],
    ['高压', '加班', '高强度', '连续'],
    ['deadline', '紧急', '赶工', '大促'],
    ['快节奏', '不确定性', '0-1', '0 到 1', '从零'],
    ['值班', 'oncall', '稳定性'],
    ['被拒', '拒绝', '业绩压力', '出差', '改稿', '多项目并行'],
  ])

  const data = countHits(cvText, [
    ['数据分析', '数据驱动', '数据敏感', '经营分析'],
    ['看板', '指标', '报表', '仪表盘'],
    ['a/b', 'ab ', '对照实验', '实验'],
    ['复盘', '归因', '洞察'],
    ['sql', 'excel', 'tableau', '神策', 'ga'],
  ])

  const userBusiness = countHits(cvText, [
    ['用户调研', '用户访谈', '用户画像', '用户洞察', '用户场景'],
    ['商业', '收入', '营收', 'arr', 'gmv', '付费', '盈利'],
    ['成本', '预算', '投入产出', 'roi'],
    ['客户', '市场', '行业'],
  ])

  const logic = countHits(cvText, [
    ['结构化', '拆解', '问题分析'],
    ['方法论', '框架', '体系'],
    ['优先级', '排期', '决策'],
    ['复盘', '根因', '归因'],
    ['prd', '需求分析', '流程设计'],
  ])

  const content = countHits(cvText, [
    ['文案', '内容'],
    ['策划', '活动'],
    ['公众号', '小红书', '抖音', '视频号', '直播', '短视频'],
    ['选题', '爆文', '10w', '阅读量'],
    ['创意', '品牌', '传播'],
  ])

  const empathy = countHits(cvText, [
    ['倾听', '共情', '同理心', '情绪'],
    ['辅导', '教练', '带教', '关怀'],
    ['员工关系', '员工沟通', '一对一'],
    ['心理咨询', '疏导'],
    ['访谈', '支持业务', '伙伴'],
  ])

  const principle = countHits(cvText, [
    ['合规', '劳动法', '仲裁'],
    ['保密', '敏感信息'],
    ['制度', '原则', '底线'],
    ['内控', '审计', '风险控制'],
    ['规范', '红线'],
  ])

  const ux = countHits(cvText, [
    ['可用性', '易用性'],
    ['交互', '用户体验', '体验设计'],
    ['信息架构'],
    ['用户研究', '用研'],
    ['走查', '还原度', '任务完成率'],
  ])

  const aesthetics = countHits(cvText, [
    ['作品集'],
    ['视觉', '审美'],
    ['品牌', '风格'],
    ['创意', '动效'],
  ])

  const ctx: FamilyContext = {
    coverage,
    matchedCount: matched.length,
    requiredCount: required.length,
    matchedLabels,
    quantified,
    education,
    papers,
    openSource,
    certs,
    collab,
    resilience,
    data,
    userBusiness,
    logic,
    content,
    empathy,
    principle,
    ux,
    aesthetics,
    learningExtra,
  }

  /* ---------- 各信号族评分器 ---------- */
  const scorers: Record<DimensionFamily, (d: CompetencyDimension) => FamilyResult> = {
    skill: () => ({
      score: clamp(
        50 + coverage * 38 + (quantified ? 5 : 0) + (matched.length >= 4 ? 4 : 0),
      ),
      evidence:
        matchedLabels.length > 0
          ? `简历覆盖 JD 要求中的 ${matched.length}/${ctx.requiredCount || '?'} 项关键能力：${matchedLabels.slice(0, 5).join('、')}${quantified ? '；且提供了量化业绩证据' : ''}`
          : '简历中未明显体现 JD 列出的核心能力关键词，专业匹配证据不足',
    }),
    learning: () => {
      const score = clamp(
        55 +
          (education - 1) * 5 +
          papers * 7 +
          openSource * 4 +
          certs * 3 +
          learningExtra * 3,
      )
      const parts: string[] = []
      if (education === 3) parts.push('博士学历')
      else if (education === 2) parts.push('硕士学历')
      else if (education === 1) parts.push('本科学历')
      if (papers) parts.push('有论文/研究产出')
      if (certs) parts.push('持有岗位相关专业认证')
      if (openSource) parts.push('有开源或公开作品')
      if (learningExtra) parts.push('有竞赛获奖或公开分享沉淀')
      return {
        score,
        evidence: parts.length ? parts.join('、') : '简历缺少学历之外的成长性证据（认证/作品/分享/获奖等）',
      }
    },
    collab: () => ({
      score: clamp(55 + ctx.collab * 7),
      evidence:
        ctx.collab > 0
          ? `简历中出现 ${ctx.collab} 类协作信号（跨部门对接/牵头推动/带人/沟通对齐等）`
          : '经历描述以个人产出为主，团队协作与横向影响的证据较少',
    }),
    resilience: () => ({
      score: clamp(53 + ctx.resilience * 7.5),
      evidence:
        ctx.resilience > 0
          ? `简历中出现 ${ctx.resilience} 类高压场景信号（上线保障/攻关/紧急任务/高强度并行等）`
          : '缺少高压目标、紧急任务或不确定性环境的经历证据',
    }),
    userBusiness: () => ({
      score: clamp(52 + ctx.userBusiness * 7 + (ctx.quantified ? 5 : 0)),
      evidence:
        ctx.userBusiness > 0
          ? `具备 ${ctx.userBusiness} 类用户/商业信号（用户研究、客户场景、收入成本或预算视角）`
          : '简历偏执行视角，缺少用户洞察与商业价值判断的直接证据',
    }),
    dataResult: () => ({
      score: clamp(52 + ctx.data * 6.5 + (ctx.quantified ? 8 : 0)),
      evidence:
        ctx.data > 0
          ? `出现 ${ctx.data} 类数据驱动信号（指标/看板/实验/复盘）${quantified ? '，且结论有量化结果支撑' : ''}`
          : '未见数据指标、实验或结果量化的描述，数据驱动能力证据不足',
    }),
    logic: () => ({
      score: clamp(53 + ctx.logic * 7 + (ctx.quantified ? 4 : 0)),
      evidence:
        ctx.logic > 0
          ? `出现 ${ctx.logic} 类结构化思维信号（拆解/方法论/优先级/复盘/流程设计）`
          : '经历多为罗列事项，缺少问题拆解、方法框架与决策逻辑的描述',
    }),
    content: () => ({
      score: clamp(52 + ctx.content * 7 + (ctx.quantified ? 5 : 0)),
      evidence:
        ctx.content > 0
          ? `出现 ${ctx.content} 类内容创意信号（文案/策划/新媒体/活动/品牌传播）${quantified ? '，并有效果数据' : ''}`
          : '缺少内容产出或创意策划类经历的直接证据',
    }),
    empathy: () => ({
      score: clamp(54 + ctx.empathy * 8 + ctx.collab * 2),
      evidence:
        ctx.empathy > 0
          ? `出现 ${ctx.empathy} 类人际敏感信号（倾听/辅导/员工沟通/情绪支持等）`
          : '简历缺少处理他人情绪、差异化沟通或辅导支持类经历，共情能力需面试验证',
    }),
    principle: () => ({
      score: clamp(54 + ctx.principle * 8),
      evidence:
        ctx.principle > 0
          ? `出现 ${ctx.principle} 类合规与原则信号（制度执行/保密/劳动法规/风险控制）`
          : '未见合规、保密或制度执行类经历，对敏感岗位需重点核实底线意识',
    }),
    ux: () => ({
      score: clamp(52 + ctx.ux * 8 + (ctx.quantified ? 4 : 0)),
      evidence:
        ctx.ux > 0
          ? `出现 ${ctx.ux} 类体验设计信号（用研/可用性/信息架构/走查）${quantified ? '，且有体验指标改善' : ''}`
          : '简历缺少用户研究与体验方法论证据，视觉产出之外的思考深度待验证',
    }),
    aesthetics: () => ({
      score: clamp(54 + ctx.aesthetics * 8 + ctx.ux * 2),
      evidence:
        ctx.aesthetics > 0
          ? `出现 ${ctx.aesthetics} 类审美创意信号（作品集/视觉风格/品牌/动效）`
          : '简历未附作品集或缺少视觉风格类描述，审美水平需现场核验',
    }),
  }

  const dimensionScores: CompetencyScore[] = dimensions.map((d) => {
    const result = scorers[d.family](d)
    return { id: d.id, label: d.label, score: result.score, evidence: result.evidence }
  })

  /* ---------- 综合评分 ---------- */
  const overall = clamp(
    dimensionScores.reduce((acc, s) => acc + s.score, 0) / dimensionScores.length,
  )

  /* ---------- 亮点 ---------- */
  const topMatched = matchedLabels.slice(0, 4).join('、')
  const highlightPool: string[] = []
  if (coverage >= 0.6) {
    highlightPool.push(
      `专业能力重合度高：JD 要求的 ${topMatched} 等关键能力在简历中均有对应经历支撑，上手成本较低`,
    )
  } else if (matchedLabels.length > 0) {
    highlightPool.push(
      `具备 ${matchedLabels.slice(0, 3).join('、')} 等岗位相关能力，存在可迁移的经验底座，部分要求可在面试中验证深度`,
    )
  }
  if (quantified) {
    highlightPool.push(
      '结果导向、证据意识强：项目经历包含明确的量化指标（增长/占比/时长/规模等），能讲清投入产出与个人贡献',
    )
  }
  if (ctx.data >= 2) {
    highlightPool.push(
      '数据驱动特征明显：熟悉指标拆解、看板与实验/复盘闭环，符合该岗位用数据支持决策的要求',
    )
  }
  if (papers) {
    highlightPool.push(
      '研究与学习潜力突出：有论文或研究项目产出，体现信息检索、科学方法与深度思考能力',
    )
  }
  if (certs) {
    highlightPool.push(
      '专业资质可信：持有岗位相关认证/证书，专业体系化程度与自我提升意愿有外部佐证',
    )
  }
  if (openSource) {
    highlightPool.push('有公开作品/开源或社区影响力，专业热情与自驱力有外部证据')
  }
  if (ctx.collab >= 3) {
    highlightPool.push(
      '协作与推动力充分：简历多次出现跨部门对接、牵头协调与带人经历，适配需要横向推动的工作场景',
    )
  }
  if (ctx.resilience >= 2) {
    highlightPool.push(
      '抗压经验丰富：经历过上线/大促/紧急攻关等高压场景，对快节奏与不确定性有心理准备',
    )
  }
  if (ctx.content >= 2) {
    highlightPool.push(
      '内容与策划能力突出：有持续的新媒体/文案/活动产出经历，并能沉淀选题与运营机制',
    )
  }
  if (ctx.userBusiness >= 2) {
    highlightPool.push(
      '用户与商业视角兼备：能从用户场景出发并关联收入、成本与客户价值，决策成熟度较高',
    )
  }
  if (highlightPool.length === 0) {
    highlightPool.push(
      '候选人背景与岗位存在一定相关性，建议通过结构化面试进一步判断能力深度与岗位意愿',
    )
  }
  const highlights = highlightPool.slice(0, 3)
  while (highlights.length < 3) {
    highlights.push('简历叙事完整、教育与职业方向一致，整体稳定性尚可')
  }

  /* ---------- 风险 ---------- */
  const riskPool: RiskItem[] = []
  if (missingLabels.length > 0) {
    riskPool.push({
      text: `JD 中明确要求的 ${missingLabels.slice(0, 3).join('、')} 在简历中未体现，需确认是未接触还是简历漏写，并评估培养成本`,
      severity: coverage < 0.4 ? 'critical' : 'warning',
    })
  }
  if (!quantified) {
    riskPool.push({
      text: '经历描述缺少可验证的量化结果（指标、规模、对比基线），存在"参与即拥有"的注水风险，建议要求其还原数据',
      severity: 'warning',
    })
  }
  const yearReq = jd.match(/(\d+)\s*年(以上|及以上)?/)
  if (yearReq && !/(\d+)\s*年.*(经验|工作)/.test(cv)) {
    riskPool.push({
      text: `JD 要求约 ${yearReq[1]} 年相关经验，但简历未清晰标注总工作年限，需核实资历是否达标`,
      severity: 'critical',
    })
  }
  if (education === 0) {
    riskPool.push({
      text: '未见明确教育背景信息，若岗位有学历硬性要求需补充核实',
      severity: 'warning',
    })
  }
  if (ctx.resilience === 0) {
    riskPool.push({
      text: '缺少高压目标、紧急任务或不确定性环境的经历证据，对岗位强度的适应力待验证',
      severity: 'warning',
    })
  }
  if (ctx.collab === 0) {
    riskPool.push({
      text: '简历偏个人贡献视角，未体现跨团队协作与影响力，沟通协同能力需要面试验证',
      severity: 'warning',
    })
  }
  // 兜底：保证输出 2 条风险/待核实项
  riskPool.push({
    text: '建议在面试中进一步验证候选人对目标行业业务场景的理解深度、入职动机与职业稳定性',
    severity: 'warning',
  })
  riskPool.push({
    text: '本报告由本地模拟引擎基于文本信号生成，仅用于产品体验；正式决策请切换真实大模型并以面试/背调结论为准',
    severity: 'warning',
  })
  const risks = riskPool.slice(0, 2)

  /* ---------- STAR 提问库（按信号族） ---------- */
  const topSkill = matchedLabels[0] ?? required[0]?.label ?? '岗位核心能力'
  const bank: Record<DimensionFamily, StarQuestion> = {
    skill: {
      dimension: dimensions.find((d) => d.family === 'skill')?.label ?? '专业能力',
      question: `请挑选一个你最有代表性的 ${topSkill} 相关项目，按 STAR 结构讲述：当时的背景与目标是什么（S/T），你设计了什么方案、做了哪些关键取舍（A），最终结果如何、用什么数据证明（R）？`,
      followUp: '追问最难的细节与备选方案对比；若重做会如何改进；指标的统计口径以及你个人的贡献边界。',
    },
    learning: {
      dimension: '学习能力与成长潜能',
      question: '请举一个你在短时间内从零掌握一项新技能/新业务并落地的例子：契机与时间压力是什么（S/T），学习路径与资源有哪些（A），掌握到什么程度、产出了什么（R）？',
      followUp: '追问学习中踩过的坑、如何验证自己真正学会、有没有输出为文档或分享。',
    },
    collab: {
      dimension: '团队协作与沟通',
      question: '请讲一次你与协作方（如业务/研发/客户）意见明显不一致的经历：分歧焦点与各方诉求是什么（S/T），你如何沟通并推动共识（A），结果与后续关系如何（R）？',
      followUp: '追问如果对方始终不认同你会怎么办；事后复盘自己在沟通上可改进的点。',
    },
    resilience: {
      dimension: '抗压与职业适应力',
      question: '请描述一次目标紧急/资源不足/连续受挫时的经历：紧迫情境与你的责任是什么（S/T），你如何排优先级、调节状态并推进（A），最终结果及你沉淀了什么机制（R）？',
      followUp: '追问高压持续了多久、如何管理精力与情绪；之后是否建立预案避免重演。',
    },
    userBusiness: {
      dimension: '用户洞察与商业理解',
      question: '请讲一次你通过用户/客户洞察改变了原有产品或业务决策的经历：当时的问题与假设是什么（S/T），你如何调研并形成判断（A），决策带来了什么业务结果（R）？',
      followUp: '追问样本与方法是否可靠；当用户诉求与商业目标冲突时如何取舍。',
    },
    dataResult: {
      dimension: '数据驱动与结果导向',
      question: '请举一个你用数据定位问题并最终拿到业务结果的例子：指标异常或目标差距是什么（S/T），你如何拆解、提出假设并验证（A），关键指标最终变化多少（R）？',
      followUp: '追问指标定义与归因可信度；如果数据不足你如何决策；实验是否有长期效果。',
    },
    logic: {
      dimension: '逻辑思维与问题拆解',
      question: '请讲一个你面对模糊复杂问题（无现成答案）的经历：问题本身和约束是什么（S/T），你用什么框架拆解、如何排优先级（A），最终方案与结果如何（R）？',
      followUp: '追问拆解中的关键假设、被排除的选项，以及事后看框架有何不足。',
    },
    content: {
      dimension: '创意策划与内容敏感度',
      question: '请介绍一次你最成功的内容/活动策划：目标与受众背景是什么（S/T），创意与执行节奏如何设计（A），传播或转化数据如何（R）？',
      followUp: '追问创意灵感来源、失败备选方案、对数据反馈做了哪些快速调整。',
    },
    empathy: {
      dimension: '共情力与人际敏感度',
      question: '请讲一次你帮助情绪激动或抗拒配合的员工/客户的经历：对方的处境与诉求是什么（S/T），你如何倾听、建立信任并推进（A），事情最终怎样收尾（R）？',
      followUp: '追问你如何判断对方真实诉求；如何在共情的同时守住原则与边界。',
    },
    principle: {
      dimension: '组织原则性',
      question: '请讲一次业务方的诉求与制度/合规要求发生冲突的经历：冲突点与压力是什么（S/T），你如何在不牺牲底线的前提下寻找方案（A），最终结果与各方反馈如何（R）？',
      followUp: '追问你判断"红线"的依据；如果上级施压要求通融，你会如何处理。',
    },
    ux: {
      dimension: '用户体验思维',
      question: '请讲一次你基于用研发现推动体验改版的经历：用户问题与证据是什么（S/T），你如何设计研究并定义改版方向（A），任务完成率/满意度等指标有何变化（R）？',
      followUp: '追问研究方法与样本偏差；当体验目标与业务转化冲突时如何平衡。',
    },
    aesthetics: {
      dimension: '审美与创意表达',
      question: '请介绍一个你最能代表审美水准的作品：项目背景与设计目标是什么（S/T），你如何探索风格、做出设计决策（A），作品最终的评价与结果如何（R）？',
      followUp: '追问灵感参考体系、如何回应"不好看/再改改"类反馈、设计取舍依据。',
    },
  }

  const familySeen = new Set<DimensionFamily>()
  const questions: StarQuestion[] = []
  for (const d of dimensions) {
    if (!familySeen.has(d.family)) {
      familySeen.add(d.family)
      const q = { ...bank[d.family] }
      if (!q.dimension) q.dimension = d.label
      questions.push(q)
    }
    if (questions.length >= 4) break
  }
  if (questions.length < 3) questions.push(bank.skill)

  /* ---------- 结论 ---------- */
  const best = [...dimensionScores].sort((a, b) => b.score - a.score)[0]
  const summary =
    overall >= 75
      ? `候选人在「${best.label}」上证据突出${matchedLabels.length ? `，且具备 ${matchedLabels.slice(0, 2).join('、')} 等关键能力，` : '，'}与${categoryLabel}岗位匹配度较高，建议进入面试并核实风险项。`
      : overall >= 60
        ? `候选人具备一定相关基础（最强项：${best.label}），但部分岗位要求证据不足，可先沟通确认深度与意愿。`
        : `候选人与${categoryLabel}岗位的核心要求重合较少（当前最强项：${best.label}），初筛匹配度偏低，建议谨慎推进。`

  return {
    score: overall,
    band: bandOf(overall),
    summary,
    categoryLabel,
    dimensionScores,
    highlights,
    risks,
    questions,
    generatedAt: new Date().toISOString(),
    model: 'local-simulation-v1',
    provider: 'demo',
  }
}
