import { useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Check,
  Copy,
  CornerDownRight,
  Download,
  FileSearch,
  GitBranch,
  Lightbulb,
  Link2,
  Loader2,
  MessagesSquare,
  Scale,
  ShieldAlert,
  Target,
  TrendingDown,
} from 'lucide-react'
import type { Assessment, DomainId } from '../types'
import { PROVIDERS } from '../lib/constants'
import { ScoreRing } from './ScoreRing'
import { RadarChart } from './RadarChart'
import {
  buildMarkdown,
  copyText,
  downloadMarkdown,
} from '../lib/exportMarkdown'

interface OutputDashboardProps {
  assessment: Assessment | null
  loading: boolean
  error: string | null
  jd: string
  onRetry: () => void
}

const DOMAIN_STYLE: Record<
  DomainId,
  { chip: string; bar: string; dot: string; text: string }
> = {
  hardSkill: {
    chip: 'border-blue-600/25 bg-blue-600/10 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300',
    bar: 'from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-500',
    dot: 'bg-blue-500 dark:bg-blue-400',
    text: 'text-blue-700 dark:text-blue-300',
  },
  cognitive: {
    chip: 'border-violet-600/25 bg-violet-600/10 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300',
    bar: 'from-violet-500 to-fuchsia-500 dark:from-violet-400 dark:to-fuchsia-500',
    dot: 'bg-violet-500 dark:bg-violet-400',
    text: 'text-violet-700 dark:text-violet-300',
  },
  behavioral: {
    chip: 'border-emerald-600/25 bg-emerald-600/10 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
    bar: 'from-emerald-500 to-teal-600 dark:from-emerald-400 dark:to-teal-500',
    dot: 'bg-emerald-500 dark:bg-emerald-400',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  roleFit: {
    chip: 'border-amber-600/25 bg-amber-600/10 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
    bar: 'from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-500',
    dot: 'bg-amber-500 dark:bg-amber-400',
    text: 'text-amber-700 dark:text-amber-300',
  },
}

function bandColor(score: number) {
  if (score >= 85)
    return 'bg-emerald-600/10 text-emerald-700 border-emerald-600/25 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
  if (score >= 70)
    return 'bg-blue-600/10 text-blue-700 border-blue-600/25 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30'
  if (score >= 60)
    return 'bg-amber-600/10 text-amber-700 border-amber-600/25 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30'
  return 'bg-rose-600/10 text-rose-700 border-rose-600/25 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30'
}

function barColor(score: number) {
  if (score >= 85)
    return 'from-emerald-500 to-teal-600 dark:from-emerald-400 dark:to-teal-500'
  if (score >= 70)
    return 'from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-500'
  if (score >= 60)
    return 'from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-500'
  return 'from-rose-500 to-red-600 dark:from-rose-400 dark:to-red-500'
}

function confidenceLabel(c: number) {
  if (c >= 0.85) return '高置信'
  if (c >= 0.68) return '中高置信'
  if (c >= 0.55) return '中置信'
  return '低置信·需面试验证'
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', { hour12: false })
}

export function OutputDashboard({
  assessment,
  loading,
  error,
  jd,
  onRetry,
}: OutputDashboardProps) {
  const [copied, setCopied] = useState(false)

  const handleDownload = () => {
    if (!assessment) return
    const md = buildMarkdown(assessment, jd)
    const stamp = new Date()
      .toISOString()
      .slice(0, 16)
      .replace(/[-T:]/g, '')
    downloadMarkdown(`AI人才胜任力评估报告_${stamp}.md`, md)
  }

  const handleCopy = async () => {
    if (!assessment) return
    await copyText(buildMarkdown(assessment, jd))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <section className="flex min-w-0 flex-col gap-5">
      {/* 标题栏 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-fg">胜任力评估结果</h2>
          <p className="mt-0.5 text-xs text-fg-faint">
            证据抽取 → 胜任力映射 → 加权评分 · Gap 分析 · BEI/STAR 面试题
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!assessment || loading}
            className="btn-ghost !px-3 !py-2 text-xs disabled:opacity-40"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                已复制
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                复制 Markdown
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!assessment || loading}
            className="btn-primary !px-3.5 !py-2 text-xs disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            导出报告
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <div className="panel flex flex-col items-center gap-3 border-rose-600/25 bg-rose-600/[0.05] px-8 py-14 text-center dark:border-rose-500/20 dark:bg-rose-500/[0.05]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600/10 dark:bg-rose-500/15">
            <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="max-w-md text-sm leading-relaxed text-rose-800/90 dark:text-rose-200/90">
            {error}
          </p>
          <button type="button" onClick={onRetry} className="btn-ghost mt-1 text-xs">
            重新尝试
          </button>
        </div>
      ) : !assessment ? (
        <EmptyState />
      ) : (
        <div key={assessment.generatedAt} className="flex flex-col gap-5">
          {/* 综合分 + 六维雷达 */}
          <div className="grid gap-5 xl:grid-cols-[minmax(0,5fr)_minmax(0,4fr)]">
            <div className="panel flex flex-col items-center gap-5 p-6 sm:flex-row">
              <ScoreRing score={assessment.score} />
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {assessment.categoryLabel && (
                    <span className="chip border border-brand/30 bg-brand/10 text-brand">
                      {assessment.categoryLabel}
                    </span>
                  )}
                  <span className={`chip border ${bandColor(assessment.score)}`}>
                    {assessment.band}
                  </span>
                </div>
                <p className="text-[15px] font-medium leading-relaxed text-fg">
                  {assessment.summary}
                </p>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-fg-faint">
                  <span>
                    服务商：
                    <span className="text-fg-soft">
                      {PROVIDERS[assessment.provider].label}
                    </span>
                  </span>
                  <span>
                    模型：<span className="font-mono text-fg-soft">{assessment.model}</span>
                  </span>
                  <span>{formatTime(assessment.generatedAt)}</span>
                </div>
              </div>
            </div>

            <div className="panel p-5" style={{ animationDelay: '60ms' }}>
              <h3 className="mb-1 text-[13px] font-semibold text-fg">
                六维能力雷达
              </h3>
              <RadarChart scores={assessment.radar} />
              <div className="mt-2 space-y-2">
                {assessment.radar.map((s) => (
                  <div key={s.id}>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="text-fg-soft">
                        {s.label}
                        <span className="ml-1 text-fg-faint">{s.enLabel}</span>
                      </span>
                      <span className="font-semibold tabular-nums text-fg">
                        {s.score}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-fg/10">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${barColor(s.score)}`}
                        style={{
                          width: `${s.score}%`,
                          transition: 'width 1s cubic-bezier(0.22,1,0.36,1)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 四大胜任力域 */}
          <div className="panel p-5" style={{ animationDelay: '100ms' }}>
            <h3 className="mb-1 flex items-center gap-2 text-[13px] font-semibold text-fg">
              <Scale className="h-5 w-5 text-brand" />
              四大胜任力域评分
              <span className="text-xs font-normal text-fg-faint">
                · 综合分 = Σ 域得分 × 固定权重
              </span>
            </h3>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {assessment.domainScores.map((d) => {
                const style = DOMAIN_STYLE[d.id]
                return (
                  <div
                    key={d.id}
                    className="rounded-xl border border-line bg-fg/[0.02] p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[13px] font-semibold text-fg">
                          {d.label}
                        </span>
                        <span className="ml-2 text-[10px] text-fg-faint">
                          {d.enLabel}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={`chip border ${style.chip}`}>
                          权重 {d.weight}%
                        </span>
                        <span className="text-lg font-bold tabular-nums text-fg">
                          {d.score}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-fg/10">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${style.bar}`}
                        style={{
                          width: `${d.score}%`,
                          transition: 'width 1s cubic-bezier(0.22,1,0.36,1)',
                        }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px]">
                      <span className="text-fg-faint">
                        置信度 {Math.round(d.confidence * 100)}% ·{' '}
                        {confidenceLabel(d.confidence)}
                      </span>
                    </div>
                    <p className="mt-2 border-t border-line/60 pt-2 text-[12px] leading-relaxed text-fg-soft">
                      {d.rationale}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 行为证据链 */}
          <div className="panel p-5" style={{ animationDelay: '140ms' }}>
            <h3 className="mb-1 flex items-center gap-2 text-[13px] font-semibold text-fg">
              <Link2 className="h-5 w-5 text-brand" />
              行为证据链 Evidence
              <span className="text-xs font-normal text-fg-faint">
                · 共 {assessment.evidence.length} 条 · 先取证、后打分
              </span>
            </h3>
            <p className="mb-4 text-xs text-fg-faint">
              每条证据均来自简历原文，并映射到具体胜任力；强度（0-5）与置信度共同决定评分。
            </p>
            {assessment.evidence.length > 0 ? (
              <div className="grid gap-2.5 md:grid-cols-2">
                {assessment.evidence.map((e) => {
                  const style = DOMAIN_STYLE[e.domain]
                  return (
                    <div
                      key={e.id}
                      className="flex gap-3 rounded-xl border border-line bg-fg/[0.02] p-3.5"
                    >
                      <span className="mt-0.5 shrink-0 font-mono text-[10px] font-semibold text-fg-faint">
                        {e.id}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="rounded-lg border-l-2 border-brand/40 bg-brand/[0.06] px-3 py-2 text-[12px] leading-relaxed text-fg-soft">
                          “{e.rawText}”
                        </p>
                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          <span className={`chip border ${style.chip}`}>
                            {e.competency}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-fg-faint">
                            强度
                            <span className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <span
                                  key={n}
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    n <= Math.round(e.strength)
                                      ? style.dot
                                      : 'bg-fg/15'
                                  }`}
                                />
                              ))}
                            </span>
                            <span className="ml-0.5 tabular-nums">{e.strength}</span>
                          </span>
                          <span className="text-[10px] tabular-nums text-fg-faint">
                            置信 {Math.round(e.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="rounded-xl border border-amber-600/25 bg-amber-600/[0.07] px-4 py-3 text-xs text-amber-800/80 dark:border-amber-500/20 dark:bg-amber-500/[0.06] dark:text-amber-200/80">
                模型未返回结构化证据（可能简历信息过少），本次结论置信度较低，请以面试验证为准。
              </p>
            )}
          </div>

          {/* 核心优势 */}
          <div className="panel p-5" style={{ animationDelay: '180ms' }}>
            <h3 className="mb-4 flex items-center gap-2 text-[13px] font-semibold text-fg">
              <BadgeCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              核心优势 Highlights
            </h3>
            <div className="grid gap-3 md:grid-cols-3">
              {assessment.highlights.map((item, i) => (
                <div
                  key={i}
                  className="flex flex-col rounded-xl border border-emerald-600/20 bg-emerald-600/[0.05] p-4 transition hover:bg-emerald-600/[0.09] dark:border-emerald-500/20 dark:bg-emerald-500/[0.06] dark:hover:bg-emerald-500/[0.09]"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600/15 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                      {i + 1}
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-700/70 dark:text-emerald-400/80">
                      Strength
                    </span>
                  </div>
                  <p className="text-[13px] leading-relaxed text-fg-soft">
                    {item.evidence}
                  </p>
                  {item.whyItMatters && (
                    <p className="mt-2.5 border-t border-emerald-600/15 pt-2 text-[11px] leading-relaxed text-emerald-800/70 dark:border-emerald-500/15 dark:text-emerald-200/70">
                      <span className="font-medium">为何重要：</span>
                      {item.whyItMatters}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Gap Analysis */}
          <div className="panel p-5" style={{ animationDelay: '220ms' }}>
            <h3 className="mb-4 flex items-center gap-2 text-[13px] font-semibold text-fg">
              <Target className="h-5 w-5 text-brand" />
              Gap 分析：岗位要求 vs 候选人能力
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-emerald-600/20 bg-emerald-600/[0.05] p-4 dark:border-emerald-500/20 dark:bg-emerald-500/[0.05]">
                <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold text-emerald-700 dark:text-emerald-300">
                  <BadgeCheck className="h-4 w-4" />
                  优势 Strengths
                </div>
                <ul className="space-y-2">
                  {assessment.gapAnalysis.strengths.map((s, i) => (
                    <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-fg-soft">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-amber-600/20 bg-amber-600/[0.05] p-4 dark:border-amber-500/20 dark:bg-amber-500/[0.05]">
                <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold text-amber-700 dark:text-amber-300">
                  <TrendingDown className="h-4 w-4" />
                  差距 Gaps
                </div>
                <ul className="space-y-2">
                  {assessment.gapAnalysis.gaps.map((g, i) => (
                    <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-fg-soft">
                      <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-4 flex gap-3 rounded-xl border border-brand/25 bg-brand/[0.07] p-4">
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <div>
                <div className="mb-1 text-[12px] font-semibold text-brand">
                  Hiring Recommendation
                </div>
                <p className="text-[13px] leading-relaxed text-fg-soft">
                  {assessment.gapAnalysis.recommendation}
                </p>
              </div>
            </div>
          </div>

          {/* 风险 */}
          <div className="panel p-5" style={{ animationDelay: '260ms' }}>
            <h3 className="mb-4 flex items-center gap-2 text-[13px] font-semibold text-fg">
              <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              潜在风险与待核实疑点 Risks
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {assessment.risks.map((risk, i) => {
                const critical = risk.severity === 'critical'
                return (
                  <div
                    key={i}
                    className={`flex gap-3 rounded-xl border p-4 ${
                      critical
                        ? 'border-rose-600/25 bg-rose-600/[0.06] dark:border-rose-500/25 dark:bg-rose-500/[0.06]'
                        : 'border-amber-600/25 bg-amber-600/[0.06] dark:border-amber-500/25 dark:bg-amber-500/[0.06]'
                    }`}
                  >
                    {critical ? (
                      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                    )}
                    <div>
                      <span
                        className={`chip mb-2 border ${
                          critical
                            ? 'border-rose-600/30 bg-rose-600/10 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300'
                            : 'border-amber-600/30 bg-amber-600/10 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300'
                        }`}
                      >
                        {critical ? '重点核实' : '建议关注'}
                      </span>
                      <p className="text-[13px] leading-relaxed text-fg-soft">
                        {risk.text}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* BEI/STAR 提问库 */}
          <div className="panel p-5" style={{ animationDelay: '300ms' }}>
            <h3 className="mb-1 flex items-center gap-2 text-[13px] font-semibold text-fg">
              <MessagesSquare className="h-5 w-5 text-brand" />
              BEI 行为面试提问库
            </h3>
            <p className="mb-5 text-xs text-fg-faint">
              由胜任力证据缺口 / 高分项 / 适配风险触发，按 Situation → Task →
              Action → Result 结构引导回答
            </p>
            <div className="space-y-4">
              {assessment.questions.map((q, i) => {
                const style = DOMAIN_STYLE[q.domain]
                return (
                  <div
                    key={i}
                    className="relative rounded-xl border border-line bg-fg/[0.02] p-4 pl-5 transition hover:border-brand/40"
                  >
                    <span className="absolute left-0 top-4 h-[calc(100%-2rem)] w-[3px] rounded-r bg-gradient-to-b from-brand to-brand-strong" />
                    <div className="mb-2.5 flex flex-wrap items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand/15 text-xs font-bold text-brand">
                        Q{i + 1}
                      </span>
                      <span className={`chip border ${style.chip}`}>
                        {q.competency}
                      </span>
                      {q.reason && (
                        <span className="chip border border-line bg-fg/[0.04] text-fg-faint">
                          {q.reason}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium leading-relaxed text-fg">
                      {q.question}
                    </p>
                    <div className="mt-3 flex gap-2 rounded-lg border border-line/70 bg-ink-950/60 px-3 py-2.5">
                      <CornerDownRight className="mt-0.5 h-4 w-4 shrink-0 text-fg-faint" />
                      <p className="text-xs leading-relaxed text-fg-soft">
                        <span className="font-medium text-fg">追问建议：</span>
                        {q.followUp}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function EmptyState() {
  return (
    <div className="panel flex flex-col items-center px-8 py-20 text-center">
      <div className="relative mb-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-brand/25 bg-brand/[0.08]">
          <FileSearch className="h-8 w-8 text-brand" />
        </div>
        <div className="absolute -inset-3 -z-10 rounded-full bg-brand/10 blur-2xl" />
      </div>
      <h3 className="text-base font-semibold text-fg">
        等待生成第一份胜任力评估报告
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-fg-faint">
        在左侧粘贴 JD 与候选人简历（或上传 PDF / Word）后点击生成；引擎会先抽取行为证据，再映射胜任力并加权评分。
      </p>
      <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-4">
        {[
          { step: '01', text: '证据抽取', icon: FileSearch },
          { step: '02', text: '胜任力映射', icon: GitBranch },
          { step: '03', text: '加权评分', icon: Scale },
          { step: '04', text: 'BEI 出题', icon: MessagesSquare },
        ].map((s) => (
          <div
            key={s.step}
            className="rounded-xl border border-line bg-fg/[0.02] px-3 py-4"
          >
            <s.icon className="mx-auto mb-1.5 h-4 w-4 text-brand/70" />
            <div className="text-sm font-bold text-brand">
              {s.step}
            </div>
            <div className="mt-1 text-xs text-fg-faint">{s.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,5fr)_minmax(0,4fr)]">
        <div className="panel flex items-center gap-6 p-6">
          <div className="skeleton h-[184px] w-[184px] shrink-0 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="skeleton h-6 w-24" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-11/12" />
            <div className="skeleton h-4 w-2/3" />
            <div className="flex items-center gap-2 pt-2 text-xs text-brand/80">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              正在抽取行为证据并映射胜任力…
            </div>
          </div>
        </div>
        <div className="panel p-5">
          <div className="skeleton mb-4 h-4 w-24" />
          <div className="skeleton mx-auto h-[230px] w-[230px] rounded-full opacity-40" />
        </div>
      </div>
      <div className="panel p-5">
        <div className="skeleton mb-4 h-4 w-40" />
        <div className="grid gap-3 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2 rounded-xl border border-line/60 p-4">
              <div className="skeleton h-4 w-2/3" />
              <div className="skeleton h-1.5 w-full" />
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-5/6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
