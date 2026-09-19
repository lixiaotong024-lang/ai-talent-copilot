import type {
  Assessment,
  CompetencyEvidence,
  DomainId,
  DomainScore,
  GapAnalysis,
  Highlight,
  RadarAxis,
  RadarId,
  RiskItem,
  StarQuestion,
} from '../types'
import { RADAR_AXES } from './constants'
import { INDUSTRY_WORDS, SKILL_LEXICON } from './skillLexicon'

/**
 * 免费体验模式：完全在浏览器本地运行的「胜任力引擎」启发式实现。
 *
 * 评估流水线（与真实大模型模式一致）：
 *   JD 解析 → Evidence Extraction（行为证据抽取）
 *   → Competency Mapping（映射到四域 / 六轴胜任力）
 *   → Score = Evidence Strength × Confidence × JD Weight
 *   → Gap Analysis → BEI/STAR 面试题
 *
 * 禁止仅凭关键词数量 / 学校 / 公司 / 年限打分：
 * 技能词命中只是「弱证据」，必须叠加角色主导性、量化结果、交付事实后才提升强度。
 */

const clamp = (n: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, Math.round(n)))
const clamp01 = (n: number) => Math.max(0.45, Math.min(0.95, n))

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

/** 量化结果信号（Result） */
const QUANT_RE =
  /\d+(\.\d+)?\s*(%|％|个百分点|倍|万|百万|亿|分|天|周|个月)|f1|auc|准确率|召回率|延迟|p99|gmv|dau|mau|roi|arr|nps|留存率|转化率|渗透率|命中率|增长|提升|降低|缩短/i

/** 主导角色信号（Ownership） */
const OWNER_WORDS = [
  '独立', '主导', '牵头', '主动', '全权', '一手', 'owner', '负责人',
  '带领', '带队', '带过', 'mentor', '0-1', '0 到 1', '从0', '从零',
]
/** 交付事实信号 */
const DELIVERY_WORDS = [
  '上线', '落地', '交付', '投产', '发布', '部署', '完成', '建成',
  '搭建', '建设', '打造', '重构', '推行', '推广',
]
/** 专业深度信号 */
const DEPTH_WORDS = [
  '架构', '核心模块', '技术方案', '自研', '深度优化', '性能优化',
  '底层', '原理', '设计并', '方案设计', '体系设计', '模型设计',
]

interface Detector {
  competency: string
  domain: DomainId
  axis?: RadarId
  words: string[]
  /** 命中时的基础证据强度 0-5 */
  base: number
}

/** 行为证据检测器：简历子句 → 胜任力映射 */
const DETECTORS: Detector[] = [
  {
    competency: '专业深度',
    domain: 'hardSkill',
    axis: 'depth',
    words: DEPTH_WORDS,
    base: 3.8,
  },
  {
    competency: '执行交付（Execution）',
    domain: 'behavioral',
    axis: 'execution',
    words: DELIVERY_WORDS,
    base: 3.4,
  },
  {
    competency: '问题解决（Problem Solving）',
    domain: 'cognitive',
    axis: 'problemSolving',
    words: [
      '解决', '攻克', '排查', '定位问题', '根因', '瓶颈', '优化',
      '命中率', '准确率', '故障', '疑难', '性能提升', '降本增效',
    ],
    base: 3.6,
  },
  {
    competency: 'Ownership（当责）',
    domain: 'behavioral',
    axis: 'execution',
    words: OWNER_WORDS,
    base: 3.7,
  },
  {
    competency: '学习敏捷（Learning Agility）',
    domain: 'cognitive',
    axis: 'learning',
    words: [
      '快速学习', '自学', '两周', '2周', '短时间', '转型', '调研',
      '快速掌握', '系统学习', '内部分享', '技术分享', '讲座', '输出文档',
      '论文', '专利', '认证', '证书', '课程',
    ],
    base: 3.3,
  },
  {
    competency: '协作与影响力（Collaboration）',
    domain: 'behavioral',
    axis: 'collaboration',
    words: [
      '跨部门', '跨团队', '跨职能', '协作', '协同', '协调', '拉通',
      '对齐', '推动', '说服', '沟通', '汇报', '配合', '对接',
    ],
    base: 3.2,
  },
  {
    competency: '创新变革（Innovation）',
    domain: 'behavioral',
    words: ['创新', '首创', '发明', '专利', '论文', '新方法', '新流程', '提出'],
    base: 3.5,
  },
  {
    competency: '专业广度（T 型迁移）',
    domain: 'hardSkill',
    axis: 'breadth',
    words: ['全栈', '跨界', '兼具', '多套', '多种技术', '从前端到后端', '横向覆盖'],
    base: 3.0,
  },
  {
    competency: '模糊环境/创业适配',
    domain: 'roleFit',
    words: ['创业', 'startup', '不确定性', '模糊', '0-1', '0 到 1', '从0', '从零'],
    base: 3.4,
  },
  {
    competency: '规范化大团队适配',
    domain: 'roleFit',
    words: ['大厂', '流程规范', '大型团队', '百人', '千人'],
    base: 3.0,
  },
]

const WHY_MAP: Record<RadarId, string> = {
  depth: '体现专业深度与复杂方案设计能力，是 Hard Skill 最直接的行为证据',
  execution: '有明确交付事实与可量化结果，印证 Execution 与结果导向',
  problemSolving: '从问题定位到指标改善形成闭环，体现 Problem Solving 能力',
  learning: '短周期掌握新能力并产出成果，印证 Learning Agility 与知识迁移',
  collaboration: '需要横向协调与推动才能完成，体现无授权影响力',
  breadth: '能力横跨多个领域，具备 T 型人才的迁移与组合优势',
}
/** 把简历拆成可分析的行为子句（粗粒度，容忍格式混乱） */
function splitClauses(cv: string): string[] {
  return cv
    .split(/\r?\n|；|;|。|•|·|①|②|③|④|⑤/)
    .map((line) =>
      line
        .replace(/^\s*(?:[-*▪◦◆]|\d+[.、)）])\s*/, '')
        .replace(/\s+/g, '')
        .trim(),
    )
    .filter((c) => c.length >= 8 && c.length <= 160)
}

export function runLocalSimulation(
  jd: string,
  cv: string,
  categoryLabel = '目标岗位',
): Assessment {
  const jdText = jd.toLowerCase()
  const cvText = cv.toLowerCase()

  /* ============ Step 1：JD 解析 ============ */
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

  const yearReq = jd.match(/(\d+)\s*年(以上|及以上)?/)
  const yearInCv = /(\d+)\s*年/.test(cv)

  /* ============ Step 2：Evidence Extraction ============ */
  const clauses = splitClauses(cv)

  // 全文级背景信号（学历/论文/认证等只作认知域的辅助证据）
  const education = has(cvText, ['博士', 'phd', 'ph.d'])
    ? 3
    : has(cvText, ['硕士', '研究生', 'master'])
      ? 2
      : has(cvText, ['本科', '学士', 'bachelor'])
        ? 1
        : 0
  const papers = countHits(cvText, [
    ['acl', 'emnlp', 'neurips', 'icml', 'naacl', 'cvpr', 'aaai', 'ijcai', 'kdd', 'sigir', 'chi'],
    ['论文', '发表', '一作', '二作', '长文', '专利'],
  ])
  const certs = countHits(cvText, [
    ['pmp', 'cfa', 'cpa', '法律职业资格', '人力资源管理师', '认证', '证书'],
  ])
  const learningExtra = countHits(cvText, [
    ['博客', '专栏', '知乎', '掘金', '技术分享', '讲座', '内部分享'],
    ['获奖', '竞赛', '金奖', '一等奖', 'acm', 'kaggle', '奖学金'],
    ['gpa', '排名前', '专业前'],
  ])

  const industryHit = INDUSTRY_WORDS.filter(
    (w) => jdText.includes(w) && cvText.includes(w),
  )
  const startupSig = countHits(cvText, [
    ['创业', 'startup'],
    ['0-1', '0 到 1', '从0', '从零'],
    ['不确定性', '模糊'],
  ])
  const bigCorpSig = countHits(cvText, [
    ['大厂', 'bat', '字节', '腾讯', '阿里', '美团', '华为', '京东'],
    ['流程规范', '大型团队', '百人'],
  ])

  const rawEvidence: CompetencyEvidence[] = []
  let quantClauses = 0
  let ownerClauses = 0
  let participateOnly = 0

  clauses.forEach((clause, idx) => {
    const lower = clause.toLowerCase()
    const quantified = QUANT_RE.test(clause)
    const owner = has(lower, OWNER_WORDS)
    if (quantified) quantClauses += 1
    if (owner) ownerClauses += 1
    if (clause.includes('参与') && !owner) participateOnly += 1

    // 每个子句最多映射 2 个胜任力（参照 BEI 编码：一个行为可同时证明多项胜任力）
    const hits: Detector[] = []
    for (const d of DETECTORS) {
      if (has(lower, d.words)) {
        // 弱信号词（沟通/推动/完成等）需要量化或主导角色加持，避免噪声
        const weakWord = d.base <= 3.4
        if (weakWord && !quantified && !owner) continue
        hits.push(d)
        if (hits.length >= 2) break
      }
    }

    // JD 关键技能 + 交付/深度动词 → 强专业证据
    const clauseSkills = matched.filter((s) =>
      s.aliases.some((a) => lower.includes(a)),
    )
    const delivery = has(lower, DELIVERY_WORDS) || has(lower, DEPTH_WORDS)
    if (clauseSkills.length > 0 && delivery) {
      hits.unshift({
        competency: `专业深度（${clauseSkills[0].label}）`,
        domain: 'hardSkill',
        axis: 'depth',
        words: [],
        base: 4.1,
      })
    } else if (clauseSkills.length > 0 && hits.length === 0) {
      // 仅出现技能名：弱证据（不能据此打高分）
      hits.push({
        competency: `专业技能出现（${clauseSkills[0].label}）`,
        domain: 'hardSkill',
        axis: 'depth',
        words: [],
        base: 2.4,
      })
    }

    for (const d of hits.slice(0, 2)) {
      const strength = clamp(
        d.base + (quantified ? 0.8 : 0) + (owner ? 0.5 : 0) - (!quantified && d.base < 3 ? 0.4 : 0),
        1,
        5,
      )
      rawEvidence.push({
        id: `e${idx}-${d.axis ?? d.domain}`,
        rawText: clause.length > 90 ? `${clause.slice(0, 90)}…` : clause,
        competency: d.competency,
        domain: d.domain,
        axis: d.axis,
        strength: Math.round(strength * 10) / 10,
        confidence: Math.round(clamp01(0.62 + (quantified ? 0.14 : 0) + (owner ? 0.09 : 0)) * 100) / 100,
      })
    }
  })

  // 同一胜任力最多保留 2 条最强证据，整体取前 10 条
  const perCompetency = new Map<string, number>()
  const evidence = rawEvidence
    .sort((a, b) => b.strength - a.strength)
    .filter((e) => {
      const n = perCompetency.get(e.competency) ?? 0
      if (n >= 2) return false
      perCompetency.set(e.competency, n + 1)
      return true
    })
    .slice(0, 10)
    .map((e, i) => ({ ...e, id: `EV-${String(i + 1).padStart(2, '0')}` }))

  const axisCount = (axis: RadarId) =>
    evidence.filter((e) => e.axis === axis).length
  const domainCount = (domain: DomainId) =>
    evidence.filter((e) => e.domain === domain).length
  const depthN = axisCount('depth')
  const breadthN = axisCount('breadth')
  const learningN = axisCount('learning')
  const psN = axisCount('problemSolving')
  const executionN = axisCount('execution')
  const collabN = axisCount('collaboration')
  const innovationN = evidence.filter(
    (e) => e.competency.includes('创新'),
  ).length

  const distinctCvSkills = new Set(
    SKILL_LEXICON.filter((s) => s.aliases.some((a) => cvText.includes(a))).map(
      (s) => s.label,
    ),
  ).size

  /* ============ Step 3：Competency Mapping + Score Aggregation ============ */
  const strongest = (axis?: RadarId, domain?: DomainId) =>
    evidence.find((e) => (axis ? e.axis === axis : e.domain === domain))

  const hardScore = clamp(
    45 +
      coverage * 30 +
      depthN * 3.5 +
      breadthN * 2 +
      (quantClauses ? 4 : 0) +
      (matched.length >= 4 ? 3 : 0),
  )
  const cognitiveScore = clamp(
    50 +
      learningN * 6 +
      psN * 6 +
      papers * 4 +
      certs * 2 +
      learningExtra * 2 +
      (quantClauses >= 2 ? 3 : 0),
  )
  const behavioralScore = clamp(
    49 +
      executionN * 5.5 +
      collabN * 5.5 +
      ownerClauses * 2.2 +
      innovationN * 3 +
      quantClauses * 2,
  )
  const roleFitScore = clamp(
    60 +
      startupSig * 5 +
      bigCorpSig * 4 +
      industryHit.length * 7 -
      (yearReq && !yearInCv ? 6 : 0),
  )

  const hardRationale =
    matchedLabels.length > 0
      ? `JD 要求的 ${matched.length}/${required.length || '?'} 项专业能力在简历中有对应经历（${matchedLabels.slice(0, 4).join('、')}）；${depthN ? `最强行为证据：「${strongest('depth')?.rawText ?? ''}」` : '但多数只停留在技能名词，缺少深度设计/落地细节'}${quantClauses ? '；并含量化结果' : '；量化结果偏少'}。`
      : '简历中未发现 JD 列出的核心专业能力的直接证据，专业匹配度低，需面试验证可迁移性。'
  const cognitiveRationale =
    learningN + psN > 0
      ? `在 ${learningN} 条学习类、${psN} 条问题解决类行为中可见证据，例如「${(strongest('problemSolving') ?? strongest('learning'))?.rawText ?? ''}」；${papers ? '另有论文/专利等研究产出；' : ''}${quantClauses >= 2 ? '多次以数据闭环验证判断。' : '数据化验证的频次一般。'}`
      : '简历多为事项罗列，缺少快速学习、复杂问题拆解或指标改善的行为描述，认知能力只能低置信度估计。'
  const behavioralRationale =
    executionN + collabN > 0
      ? `${executionN ? `执行/当责证据 ${executionN} 条（如「${strongest('execution')?.rawText ?? ''}」）；` : '缺少主导/交付类证据；'}${collabN ? `跨团队协作证据 ${collabN} 条。` : '未见跨团队推动与影响力证据。'}${ownerClauses ? ` 主导角色信号出现 ${ownerClauses} 次。` : ''}`
      : '经历以参与执行为主，Ownership、横向影响与抗压交付的行为证据不足。'
  const roleFitRationale =
    `行业相关信号 ${industryHit.length} 项（${industryHit.slice(0, 3).join('、') || '无明显重合'}）；` +
    `${startupSig ? '有 0-1/不确定性环境经历；' : ''}${bigCorpSig ? '有规范化大组织经历；' : ''}` +
    `${yearReq && !yearInCv ? `JD 要求约 ${yearReq[1]} 年经验但简历未清晰标注年限；` : ''}职业稳定性与入职动机需面谈确认（简历文本无法充分证明，故置信度从低）。`

  const domainScores: DomainScore[] = [
    {
      id: 'hardSkill',
      label: '专业能力',
      enLabel: 'Hard Skill',
      weight: 40,
      score: hardScore,
      confidence: Math.round(clamp01(0.55 + Math.min(domainCount('hardSkill'), 5) * 0.06 + coverage * 0.12) * 100) / 100,
      rationale: hardRationale,
    },
    {
      id: 'cognitive',
      label: '认知能力',
      enLabel: 'Cognitive Ability',
      weight: 25,
      score: cognitiveScore,
      confidence: Math.round(clamp01(0.55 + Math.min(learningN + psN, 5) * 0.07 + papers * 0.05) * 100) / 100,
      rationale: cognitiveRationale,
    },
    {
      id: 'behavioral',
      label: '行为胜任力',
      enLabel: 'Behavioral Competency',
      weight: 25,
      score: behavioralScore,
      confidence: Math.round(clamp01(0.52 + Math.min(executionN + collabN, 5) * 0.07 + (ownerClauses ? 0.05 : 0)) * 100) / 100,
      rationale: behavioralRationale,
    },
    {
      id: 'roleFit',
      label: '岗位匹配',
      enLabel: 'Role Fit',
      weight: 10,
      score: roleFitScore,
      confidence: Math.round(clamp01(0.5 + startupSig * 0.07 + bigCorpSig * 0.05 + industryHit.length * 0.08) * 100) / 100,
      rationale: roleFitRationale,
    },
  ]

  const radar: RadarAxis[] = RADAR_AXES.map((axis) => {
    let score: number
    switch (axis.id) {
      case 'depth':
        score = clamp(44 + coverage * 28 + depthN * 6 + (quantClauses ? 4 : 0))
        break
      case 'breadth':
        score = clamp(50 + breadthN * 7 + Math.min(distinctCvSkills, 10) * 2.5)
        break
      case 'learning':
        score = clamp(50 + learningN * 6.5 + papers * 4 + certs * 2 + learningExtra * 2)
        break
      case 'problemSolving':
        score = clamp(50 + psN * 6.5 + quantClauses * 3)
        break
      case 'execution':
        score = clamp(49 + executionN * 5.5 + ownerClauses * 3.5 + quantClauses * 3)
        break
      case 'collaboration':
        score = clamp(49 + collabN * 7)
        break
    }
    return { ...axis, score }
  })

  const overall = clamp(
    domainScores.reduce((acc, d) => acc + d.score * (d.weight / 100), 0),
  )

  /* ============ Step 4：Highlights（证据 + 为什么重要） ============ */
  const highlightPool: Highlight[] = []
  const usedAxis = new Set<RadarId>()
  for (const e of evidence) {
    if (e.axis && e.strength >= 3.4 && !usedAxis.has(e.axis)) {
      usedAxis.add(e.axis)
      highlightPool.push({
        evidence: e.rawText,
        whyItMatters: WHY_MAP[e.axis],
      })
    }
    if (highlightPool.length >= 3) break
  }
  if (highlightPool.length < 3 && coverage >= 0.6) {
    highlightPool.push({
      evidence: `简历覆盖 JD 要求的 ${matchedLabels.slice(0, 4).join('、')} 等关键专业能力`,
      whyItMatters: '专业重合度高，上手成本与培养周期显著低于平均候选人',
    })
  }
  if (highlightPool.length < 3 && quantClauses >= 2) {
    highlightPool.push({
      evidence: '多个项目经历给出了明确的量化结果与对比基线',
      whyItMatters: '结果意识强、表述可验证，降低了"参与即拥有"的注水风险',
    })
  }
  while (highlightPool.length < 3) {
    highlightPool.push({
      evidence: '教育背景与职业方向基本一致，经历叙事连贯',
      whyItMatters: '职业稳定性尚可，但需在 BEI 面试中进一步取证能力深度',
    })
  }
  const highlights = highlightPool.slice(0, 3)

  /* ============ Step 5：Risks（证据缺口 / 表述风险） ============ */
  const riskPool: RiskItem[] = []
  if (missingLabels.length > 0) {
    riskPool.push({
      text: `岗位要求的 ${missingLabels.slice(0, 3).join('、')} 在简历中无对应行为证据，需确认是未接触还是漏写，并评估培养成本`,
      severity: coverage < 0.4 ? 'critical' : 'warning',
    })
  }
  if (quantClauses === 0) {
    riskPool.push({
      text: '全部经历均无可验证的量化结果（指标/规模/基线对比），存在"参与即拥有"的注水风险，面试应要求还原数据与个人贡献边界',
      severity: 'critical',
    })
  }
  if (participateOnly >= 2 && ownerClauses === 0) {
    riskPool.push({
      text: '经历多次以"参与"表述但无主导角色证据，团队中的实际职责与影响力不明确，需用 BEI 追问其独立决策部分',
      severity: 'warning',
    })
  }
  if (collabN === 0) {
    riskPool.push({
      text: '未见跨团队协作、沟通对齐或横向推动的行为证据，协作影响力只能低置信度估计',
      severity: 'warning',
    })
  }
  if (yearReq && !yearInCv) {
    riskPool.push({
      text: `JD 要求约 ${yearReq[1]} 年相关经验，简历未清晰标注总工作年限，资历达标情况需核实`,
      severity: 'critical',
    })
  }
  if (education === 0) {
    riskPool.push({
      text: '未见明确教育背景信息，若岗位有学历硬性要求需补充核实（学校本身不作评分依据）',
      severity: 'warning',
    })
  }
  if (depthN === 0) {
    riskPool.push({
      text: '缺少体现专业深度的行为证据（架构设计、核心难点、方案取舍），能力停留在"用过"还是"精通"无法从简历判断',
      severity: 'warning',
    })
  }
  if (riskPool.length === 0) {
    riskPool.push({
      text: '简历证据链较完整，建议面试中仍对关键项目的个人贡献边界与数据口径做背调级核实',
      severity: 'warning',
    })
  }
  if (riskPool.length < 2) {
    riskPool.push({
      text: '部分能力评分仅基于有限的书面证据，建议以 BEI 追问补充场景化取证，避免单次简历材料造成高估',
      severity: 'warning',
    })
  }
  const risks = riskPool.slice(0, 3)

  /* ============ Step 6：Gap Analysis ============ */
  const sortedAxes = [...radar].sort((a, b) => b.score - a.score)
  const strengths: string[] = []
  if (coverage >= 0.6) {
    strengths.push(
      `专业能力与 JD 重合度高（${matched.length}/${required.length || '?'}：${matchedLabels.slice(0, 4).join('、')}）`,
    )
  }
  strengths.push(
    `${sortedAxes[0].label}表现突出（${sortedAxes[0].score} 分），有行为证据支撑`,
  )
  if (sortedAxes[1].score >= 65) {
    strengths.push(`${sortedAxes[1].label}同样在均值以上（${sortedAxes[1].score} 分）`)
  }
  if (ownerClauses >= 2) strengths.push('多次承担主导/Owner 角色，当责意识强')

  const gaps: string[] = []
  if (missingLabels.length > 0) {
    gaps.push(`缺少岗位明确要求：${missingLabels.slice(0, 3).join('、')}`)
  }
  const weakAxes = [...radar].sort((a, b) => a.score - b.score).slice(0, 2)
  for (const axis of weakAxes) {
    if (axis.score < 70) {
      gaps.push(`${axis.label}行为证据不足（${axis.score} 分），简历未见对应经历`)
    }
  }
  if (quantClauses === 0) gaps.push('经历缺少量化结果，能力强弱无法横向比较')
  if (gaps.length === 0) gaps.push('未发现明显硬差距，重点在面试中验真证据细节')

  const recommendation =
    overall >= 75
      ? `建议进入面试：专业与行为证据匹配度较高，优先用 BEI 对 ${weakAxes[0].label}、${weakAxes[1].label} 取证，并核实 ${missingLabels[0] ?? '关键项目数据口径'}。`
      : overall >= 60
        ? `可进一步沟通：存在可迁移底座但证据不充分，建议先做 30 分钟电话面，重点验证 ${weakAxes.map((a) => a.label).join('、')} 与入职动机后再决定是否推进。`
        : `初筛匹配度偏低：与岗位核心要求差距明显，不建议直接进入正式流程；如考虑转岗/培养，需先验证 ${weakAxes[0].label} 的潜力证据。`

  const gapAnalysis: GapAnalysis = {
    strengths: strengths.slice(0, 3),
    gaps: gaps.slice(0, 3),
    recommendation,
  }

  /* ============ Step 7：BEI/STAR 问题（由证据缺口与风险触发） ============ */
  const QUESTION_BANK: Record<
    RadarId | 'roleFit',
    { competency: string; domain: DomainId; question: string; followUp: string }
  > = {
    depth: {
      competency: '专业深度',
      domain: 'hardSkill',
      question:
        '请挑一个你最有技术/专业深度的项目：系统当时面临的核心难点是什么（S/T）？你做了哪些关键方案取舍、为什么（A）？最终用什么指标证明方案有效（R）？',
      followUp: '追问备选方案对比、失败的尝试、你个人负责的模块边界；若重做会如何改进。',
    },
    execution: {
      competency: '执行交付（Execution）',
      domain: 'behavioral',
      question:
        '请讲一个你在资源不足或时间紧迫下仍然交付的项目：目标与约束是什么（S/T）？你如何拆路径、排优先级并推动落地（A）？最终交付结果与数据如何（R）？',
      followUp: '追问延期风险如何管理、过程中砍掉了什么、量化结果的统计口径。',
    },
    problemSolving: {
      competency: '问题解决（Problem Solving）',
      domain: 'cognitive',
      question:
        '请分享一次你定位并解决复杂问题的经历：异常现象与你的初始假设是什么（S/T）？你如何拆解、验证假设并找到根因（A）？问题解决后带来了什么可量化变化（R）？',
      followUp: '追问走过哪些弯路、如何排除干扰因素、解决方法是否被沉淀为机制。',
    },
    learning: {
      competency: '学习敏捷（Learning Agility）',
      domain: 'cognitive',
      question:
        '请举一个你在短时间内从零掌握一项新技能/新业务并投入实战的例子：契机与时间压力是什么（S/T）？学习路径与资源有哪些（A）？掌握到什么程度、产出了什么成果（R）？',
      followUp: '追问学习中踩过的坑、如何验证自己真正学会、有无输出为文档或团队分享。',
    },
    collaboration: {
      competency: '协作与影响力（Collaboration）',
      domain: 'behavioral',
      question:
        '请讲一次你与协作方（业务/研发/客户/设计等）意见明显冲突的经历：分歧焦点与各方诉求是什么（S/T）？你在没有汇报权的情况下如何推动共识（A）？结果与后续合作关系如何（R）？',
      followUp: '追问如果对方始终不认同你怎么办；事后复盘自己在沟通上的可改进点。',
    },
    breadth: {
      competency: '专业广度与知识迁移',
      domain: 'hardSkill',
      question:
        '请讲一次你把 A 领域的方法迁移到 B 领域解决问题的经历：两个领域的差异是什么（S/T）？你如何抽象共性并改造方法（A）？迁移后的实际效果如何（R）？',
      followUp: '追问迁移中失效的部分、你如何补知识缺口、对方领域专家如何评价。',
    },
    roleFit: {
      competency: '职业动机与环境适配',
      domain: 'roleFit',
      question:
        '请谈谈你选择下一份工作最看重的三个因素，以及过去哪段经历最能说明你适合我们这种团队环境：当时的环境与你的选择是什么（S/T/A）？结果与你现在回头的评价如何（R）？',
      followUp: '追问离职原因、对模糊分工/快节奏的接受度、职业稳定性预期与 offer 选择标准。',
    },
  }

  const questions: StarQuestion[] = []
  const ascAxes = [...radar].sort((a, b) => a.score - b.score)
  // 最弱两项 → 证据不足，BEI 取证
  for (const axis of ascAxes.slice(0, 2)) {
    const q = QUESTION_BANK[axis.id]
    questions.push({
      ...q,
      reason: `「${axis.label}」仅 ${axis.score} 分、简历证据不足，BEI 重点取证`,
    })
  }
  // 最强项 → 高分验真，防止注水
  const best = ascAxes[ascAxes.length - 1]
  questions.push({
    ...QUESTION_BANK[best.id],
    reason: `「${best.label}」是最高项（${best.score} 分），需深挖细节验证真实性`,
  })
  // Role fit → 适配/稳定性核实
  questions.push({
    ...QUESTION_BANK.roleFit,
    reason: '简历文本无法证明职业稳定性与团队环境适配，必须面谈核实',
  })

  /* ============ 结论 ============ */
  const summary =
    overall >= 75
      ? `四域加权 ${overall} 分：专业与行为证据链较完整，最强项为「${sortedAxes[0].label}」，与${categoryLabel}岗位匹配度较高，建议面试并对薄弱域 BEI 取证。`
      : overall >= 60
        ? `四域加权 ${overall} 分：具备一定可迁移基础（最强项「${sortedAxes[0].label}」），但 ${weakAxes.map((a) => a.label).join('、')} 证据不足，建议先沟通验真。`
        : `四域加权 ${overall} 分：与${categoryLabel}岗位核心要求的行为证据重合较少（${weakAxes[0].label} 最弱），初筛匹配度偏低，建议谨慎推进。`

  return {
    score: overall,
    band: bandOf(overall),
    summary,
    categoryLabel,
    domainScores,
    radar,
    evidence,
    highlights,
    risks,
    gapAnalysis,
    questions,
    generatedAt: new Date().toISOString(),
    model: 'competency-engine-v2',
    provider: 'demo',
  }
}
